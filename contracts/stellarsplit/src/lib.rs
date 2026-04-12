#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, vec, Address, Env, Map, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Split(u64),
    SplitCount,
}

#[contracttype]
#[derive(Clone)]
pub struct Split {
    pub id: u64,
    pub initiator: Address,
    pub description: String,
    pub total_amount: i128,
    pub token: Address,
    pub participants: Vec<Address>,
    pub paid: Map<Address, bool>,
    pub settled: bool,
}

#[contract]
pub struct StellarSplitContract;

#[contractimpl]
impl StellarSplitContract {
    /// Create a new bill split.
    /// The initiator defines the total amount, token, and participants.
    pub fn create_split(
        env: Env,
        initiator: Address,
        description: String,
        total_amount: i128,
        token: Address,
        participants: Vec<Address>,
    ) -> u64 {
        initiator.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SplitCount)
            .unwrap_or(0);
        let id = count + 1;

        let paid: Map<Address, bool> = Map::new(&env);

        let split = Split {
            id,
            initiator: initiator.clone(),
            description,
            total_amount,
            token,
            participants,
            paid,
            settled: false,
        };

        env.storage().instance().set(&DataKey::Split(id), &split);
        env.storage().instance().set(&DataKey::SplitCount, &id);

        env.events()
            .publish((symbol_short!("created"), initiator), id);

        id
    }

    /// A participant pays their share of the split.
    /// Each participant owes total_amount / participants.len() tokens.
    pub fn pay_share(env: Env, split_id: u64, participant: Address) {
        participant.require_auth();

        let mut split: Split = env
            .storage()
            .instance()
            .get(&DataKey::Split(split_id))
            .expect("Split not found");

        assert!(!split.settled, "Split already settled");

        let already_paid = split.paid.get(participant.clone()).unwrap_or(false);
        assert!(!already_paid, "Already paid");

        let share = split.total_amount / split.participants.len() as i128;
        let contract_address = env.current_contract_address();

        token::Client::new(&env, &split.token).transfer(
            &participant,
            &contract_address,
            &share,
        );

        split.paid.set(participant.clone(), true);

        env.events()
            .publish((symbol_short!("paid"), participant.clone()), split_id);

        // Check if all participants have paid
        let all_paid = split
            .participants
            .iter()
            .all(|p| split.paid.get(p).unwrap_or(false));

        if all_paid {
            // Release full amount to the initiator
            token::Client::new(&env, &split.token).transfer(
                &contract_address,
                &split.initiator,
                &split.total_amount,
            );
            split.settled = true;
            env.events()
                .publish((symbol_short!("settled"),), split_id);
        }

        env.storage().instance().set(&DataKey::Split(split_id), &split);
    }

    /// Get split details by ID.
    pub fn get_split(env: Env, split_id: u64) -> Split {
        env.storage()
            .instance()
            .get(&DataKey::Split(split_id))
            .expect("Split not found")
    }

    /// Check how many splits exist.
    pub fn split_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::SplitCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env, String};

    #[test]
    fn test_create_and_pay_split() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let participant1 = Address::generate(&env);
        let participant2 = Address::generate(&env);

        // Register a mock token
        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_contract.address();

        let participants = vec![&env, participant1.clone(), participant2.clone()];

        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Team lunch"),
            &200,
            &token_address,
            &participants,
        );

        assert_eq!(split_id, 1);
        assert_eq!(client.split_count(), 1);

        let split = client.get_split(&split_id);
        assert_eq!(split.total_amount, 200);
        assert!(!split.settled);
    }
}
