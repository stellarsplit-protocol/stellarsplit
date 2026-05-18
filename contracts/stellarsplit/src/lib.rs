#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, String, Vec,
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
    pub paid_count: u32,
    pub settled: bool,
}

#[contract]
pub struct StellarSplitContract;

#[contractimpl]
impl StellarSplitContract {
    /// Create a new bill split.
    /// The initiator defines the total amount, token, and participants.
    /// Participants are the people who owe money (the initiator already fronted the bill).
    pub fn create_split(
        env: Env,
        initiator: Address,
        description: String,
        total_amount: i128,
        token: Address,
        participants: Vec<Address>,
    ) -> u64 {
        initiator.require_auth();

        assert!(total_amount > 0, "Amount must be positive");
        assert!(participants.len() > 0, "Must have at least one participant");

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
            paid_count: 0,
            settled: false,
        };

        env.storage().instance().set(&DataKey::Split(id), &split);
        env.storage().instance().set(&DataKey::SplitCount, &id);

        env.events()
            .publish((symbol_short!("created"), initiator), id);

        id
    }

    /// A participant pays their share of the split.
    /// Share = total_amount / participants.len(), with any remainder added to the last payer.
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

        // Verify this address is a participant
        let is_participant = split.participants.iter().any(|p| p == participant);
        assert!(is_participant, "Not a participant");

        let participant_count = split.participants.len() as i128;
        let base_share = split.total_amount / participant_count;
        let paid_count_after = split.paid_count + 1;

        // Last payer covers any remainder from integer division
        let share = if paid_count_after as i128 == participant_count {
            split.total_amount - (base_share * (participant_count - 1))
        } else {
            base_share
        };

        let contract_address = env.current_contract_address();
        token::Client::new(&env, &split.token).transfer(
            &participant,
            &contract_address,
            &share,
        );

        split.paid.set(participant.clone(), true);
        split.paid_count = paid_count_after;

        env.events()
            .publish((symbol_short!("paid"), participant.clone()), split_id);

        // When all participants have paid, release funds to the initiator
        if paid_count_after as i128 == participant_count {
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

    /// Cancel a split and refund all participants who have already paid.
    /// Only the initiator can cancel, and only if the split is not yet settled.
    pub fn cancel_split(env: Env, split_id: u64) {
        let mut split: Split = env
            .storage()
            .instance()
            .get(&DataKey::Split(split_id))
            .expect("Split not found");

        assert!(!split.settled, "Split already settled");
        split.initiator.require_auth();

        let participant_count = split.participants.len() as i128;
        let base_share = split.total_amount / participant_count;
        let contract_address = env.current_contract_address();

        // Refund everyone who has paid
        let mut refunded: u32 = 0;
        for p in split.participants.iter() {
            if split.paid.get(p.clone()).unwrap_or(false) {
                refunded += 1;
                // Last payer got the remainder, so refund them the remainder too
                let refund_amount = if refunded == split.paid_count {
                    split.total_amount - (base_share * (participant_count - 1))
                } else {
                    base_share
                };
                token::Client::new(&env, &split.token).transfer(
                    &contract_address,
                    &p,
                    &refund_amount,
                );
            }
        }

        split.settled = true;
        env.storage().instance().set(&DataKey::Split(split_id), &split);

        env.events()
            .publish((symbol_short!("cancelled"),), split_id);
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
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        vec, Env, String,
    };

    fn setup_token<'a>(env: &'a Env, admin: &Address) -> (TokenClient<'a>, Address) {
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_address = token_contract.address();
        let token = TokenClient::new(env, &token_address);
        (token, token_address)
    }

    fn mint(env: &Env, _admin: &Address, token_address: &Address, to: &Address, amount: i128) {
        let asset_client = StellarAssetClient::new(env, token_address);
        asset_client.mock_all_auths().mint(to, &amount);
    }

    #[test]
    fn test_create_split() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (_, token_address) = setup_token(&env, &token_admin);

        let participants = vec![&env, p1.clone(), p2.clone()];
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
        assert_eq!(split.paid_count, 0);
        assert!(!split.settled);
    }

    #[test]
    fn test_full_pay_and_settle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (token, token_address) = setup_token(&env, &token_admin);

        // Mint tokens to participants (100 each for a 200 total split)
        mint(&env, &token_admin, &token_address, &p1, 100);
        mint(&env, &token_admin, &token_address, &p2, 100);

        let participants = vec![&env, p1.clone(), p2.clone()];
        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Airbnb"),
            &200,
            &token_address,
            &participants,
        );

        let initiator_balance_before = token.balance(&initiator);

        client.pay_share(&split_id, &p1);
        let split = client.get_split(&split_id);
        assert_eq!(split.paid_count, 1);
        assert!(!split.settled);

        client.pay_share(&split_id, &p2);
        let split = client.get_split(&split_id);
        assert_eq!(split.paid_count, 2);
        assert!(split.settled);

        // Initiator received full amount
        assert_eq!(token.balance(&initiator), initiator_balance_before + 200);
        // Participants paid their shares
        assert_eq!(token.balance(&p1), 0);
        assert_eq!(token.balance(&p2), 0);
    }

    #[test]
    fn test_odd_amount_remainder() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let p3 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (token, token_address) = setup_token(&env, &token_admin);

        // 100 split 3 ways: p1=33, p2=33, p3=34 (remainder)
        mint(&env, &token_admin, &token_address, &p1, 100);
        mint(&env, &token_admin, &token_address, &p2, 100);
        mint(&env, &token_admin, &token_address, &p3, 100);

        let participants = vec![&env, p1.clone(), p2.clone(), p3.clone()];
        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Dinner"),
            &100,
            &token_address,
            &participants,
        );

        client.pay_share(&split_id, &p1);
        client.pay_share(&split_id, &p2);
        client.pay_share(&split_id, &p3);

        let split = client.get_split(&split_id);
        assert!(split.settled);
        // Initiator got the full 100
        assert_eq!(token.balance(&initiator), 100);
    }

    #[test]
    fn test_cancel_split_refunds_paid_participants() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (token, token_address) = setup_token(&env, &token_admin);

        mint(&env, &token_admin, &token_address, &p1, 100);
        mint(&env, &token_admin, &token_address, &p2, 100);

        let participants = vec![&env, p1.clone(), p2.clone()];
        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Concert"),
            &200,
            &token_address,
            &participants,
        );

        // Only p1 pays before cancellation
        client.pay_share(&split_id, &p1);
        assert_eq!(token.balance(&p1), 0);

        client.cancel_split(&split_id);

        // p1 gets refunded
        assert_eq!(token.balance(&p1), 100);
        // p2 never paid, no change
        assert_eq!(token.balance(&p2), 100);

        let split = client.get_split(&split_id);
        assert!(split.settled);
    }

    #[test]
    #[should_panic(expected = "Not a participant")]
    fn test_non_participant_cannot_pay() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let outsider = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (_, token_address) = setup_token(&env, &token_admin);

        let participants = vec![&env, p1.clone()];
        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Coffee"),
            &10,
            &token_address,
            &participants,
        );

        client.pay_share(&split_id, &outsider);
    }

    #[test]
    #[should_panic(expected = "Already paid")]
    fn test_cannot_pay_twice() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarSplitContract, ());
        let client = StellarSplitContractClient::new(&env, &contract_id);

        let initiator = Address::generate(&env);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let (_, token_address) = setup_token(&env, &token_admin);

        mint(&env, &token_admin, &token_address, &p1, 1000);

        // Two participants so the split doesn't settle after p1's first payment
        let participants = vec![&env, p1.clone(), p2.clone()];
        let split_id = client.create_split(
            &initiator,
            &String::from_str(&env, "Coffee"),
            &20,
            &token_address,
            &participants,
        );

        client.pay_share(&split_id, &p1);
        client.pay_share(&split_id, &p1);
    }
}
