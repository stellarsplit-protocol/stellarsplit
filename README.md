# StellarSplit ✦

**Decentralized group bill splitting on the Stellar network powered by Soroban smart contracts.**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple)](https://soroban.stellar.org)
[![Testnet](https://img.shields.io/badge/Testnet-Live-green)](https://stellar.expert/explorer/testnet/contract/CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH)

---

## Overview

StellarSplit lets groups split bills and settle payments **without a middleman**. The initiator — whoever paid the bill upfront — creates a split on-chain. Each participant pays their share directly to the smart contract. Once everyone has paid, the full amount is automatically released to the initiator. No Venmo, no chasing people, no trust required.

Powered by [Soroban](https://soroban.stellar.org), Stellar's smart contract platform:

- **Instant finality** — transactions settle in 3–5 seconds
- **Near-zero fees** — fractions of a cent per transaction
- **Trustless escrow** — the contract holds funds; neither party can run off with them
- **Transparent logic** — every rule is on-chain and fully auditable

---

## Live Deployment

| Network | Contract ID |
|---------|-------------|
| Stellar Testnet | [`CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH`](https://stellar.expert/explorer/testnet/contract/CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH) |

> Mainnet deployment coming after audit.

---

## How It Works

### The Flow

```
Initiator pays bill upfront
        │
        ▼
  create_split(description, total_amount, token, [participant1, participant2, ...])
        │
        ▼
  Contract stores split, assigns ID, emits "created" event
        │
        ├──▶ participant1 calls pay_share(split_id)
        │        └─ transfers their share to contract, emits "paid" event
        │
        ├──▶ participant2 calls pay_share(split_id)
        │        └─ transfers their share to contract, emits "paid" event
        │
        └──▶ All paid? → contract transfers total_amount to initiator
                               emits "settled" event
```

### Share Calculation

Each participant owes `total_amount / participants.len()`. Integer division is handled correctly: the **last payer** covers any remainder, so the initiator always receives exactly `total_amount`.

Example — 100 XLM split 3 ways:
- Participant 1 pays **33 XLM**
- Participant 2 pays **33 XLM**
- Participant 3 pays **34 XLM** (covers the 1 XLM remainder)
- Initiator receives **100 XLM** ✓

### Cancellation

If a split needs to be cancelled, the initiator calls `cancel_split`. The contract **automatically refunds** every participant who has already paid. Participants who haven't paid yet owe nothing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust + Soroban SDK v22 |
| Frontend | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 |
| Wallet | Freighter (via `@stellar/freighter-api` v6) |
| Contract Interaction | `@stellar/stellar-sdk` v15 |
| Network | Stellar Testnet / Mainnet |

---

## Repository Structure

```
stellarsplit/
├── contracts/
│   └── stellarsplit/
│       └── src/lib.rs        # Soroban smart contract (Rust)
├── components/
│   ├── CreateSplitForm.tsx   # On-chain form — calls create_split
│   ├── SplitList.tsx         # Reads splits from chain, pay/cancel actions
│   ├── Navbar.tsx            # Navigation + Freighter wallet connect
│   └── WalletConnect.tsx     # Connect/disconnect wallet button
├── lib/
│   ├── stellar.ts            # All contract interactions + Stellar SDK helpers
│   └── WalletContext.tsx     # Shared wallet state via React context
├── app/
│   ├── page.tsx              # Landing page
│   ├── app/page.tsx          # Dashboard (create + list splits)
│   └── layout.tsx            # Root layout with WalletProvider
└── .env.local.example        # Required environment variables
```

---

## Smart Contract Reference

Contract deployed at [`CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH`](https://stellar.expert/explorer/testnet/contract/CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH) on Stellar Testnet.

### `create_split`

```rust
pub fn create_split(
    env: Env,
    initiator: Address,         // person who fronted the bill — must sign
    description: String,        // e.g. "Team dinner"
    total_amount: i128,         // in stroops (1 XLM = 10_000_000 stroops)
    token: Address,             // Stellar asset contract address
    participants: Vec<Address>, // addresses who owe money
) -> u64                        // returns the new split ID
```

Creates a new split and stores it in contract storage. Emits a `created` event. The initiator must authorize this call.

**Constraints:** `total_amount > 0`, at least 1 participant.

---

### `pay_share`

```rust
pub fn pay_share(
    env: Env,
    split_id: u64,
    participant: Address, // must be in the participants list — must sign
)
```

Transfers the caller's share to the contract. If this is the last payment, the full `total_amount` is automatically forwarded to the initiator and the split is marked settled.

**Constraints:** caller must be a registered participant, cannot pay twice, split must not be settled.

---

### `cancel_split`

```rust
pub fn cancel_split(env: Env, split_id: u64)
```

Initiator-only. Cancels the split and refunds every participant who has already paid. Marks the split as settled, preventing further payments.

---

### `get_split`

```rust
pub fn get_split(env: Env, split_id: u64) -> Split
```

Read-only. Returns full split details.

```rust
pub struct Split {
    pub id: u64,
    pub initiator: Address,
    pub description: String,
    pub total_amount: i128,
    pub token: Address,
    pub participants: Vec<Address>,
    pub paid: Map<Address, bool>,
    pub paid_count: u32,       // how many participants have paid
    pub settled: bool,
}
```

---

### `split_count`

```rust
pub fn split_count(env: Env) -> u64
```

Returns total number of splits ever created.

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Rust** + `cargo` — [rustup.rs](https://rustup.rs)
- **Stellar CLI** — [install guide](https://developers.stellar.org/docs/tools/developer-tools/stellar-cli)
- **Freighter Wallet** browser extension — [freighter.app](https://freighter.app)

---

### Run the Frontend Locally

```bash
git clone https://github.com/stellarsplit-protocol/stellarsplit.git
cd stellarsplit

npm install

cp .env.local.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ID=CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect Freighter to Stellar Testnet, and start splitting.

---

### Build & Test the Contract

```bash
cd contracts

# Run all 6 tests
cargo test

# Build the WASM binary
stellar contract build
```

Output binary: `contracts/target/wasm32v1-none/release/stellarsplit.wasm`

**Test coverage:**

| Test | What it checks |
|------|---------------|
| `test_create_split` | Split creation, ID increment, storage |
| `test_full_pay_and_settle` | All participants pay, initiator receives total |
| `test_odd_amount_remainder` | Last payer covers integer division remainder |
| `test_cancel_split_refunds_paid_participants` | Cancel refunds only those who paid |
| `test_cannot_pay_twice` | Double payment reverts with "Already paid" |
| `test_non_participant_cannot_pay` | Outsider payment reverts with "Not a participant" |

---

### Deploy Your Own Instance

**1. Create and fund a testnet account**

```bash
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet
```

**2. Build**

```bash
cd contracts
stellar contract build
```

**3. Deploy**

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellarsplit.wasm \
  --source deployer \
  --network testnet
```

Copy the contract ID into `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ID=<your-contract-id>
```

**4. Get the native XLM token address**

```bash
stellar contract id asset --asset native --network testnet
# CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Set this as `NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS` in `.env.local`.

---

### Interact via CLI

```bash
# Create a split (100 XLM = 1_000_000_000 stroops)
stellar contract invoke \
  --id CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH \
  --source deployer \
  --network testnet \
  -- create_split \
  --initiator $(stellar keys address deployer) \
  --description "Team lunch" \
  --total_amount 1000000000 \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --participants '["GABC...","GDEF..."]'

# Pay a share
stellar contract invoke \
  --id CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH \
  --source participant_key \
  --network testnet \
  -- pay_share \
  --split_id 1 \
  --participant $(stellar keys address participant_key)

# Check a split
stellar contract invoke \
  --id CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH \
  --source deployer \
  --network testnet \
  -- get_split \
  --split_id 1

# Cancel a split
stellar contract invoke \
  --id CDIKR7ABKZHJU3L54CRNDECEDOFRCOMCWTOUAX22MVDNXEN2EOMA4QFH \
  --source deployer \
  --network testnet \
  -- cancel_split \
  --split_id 1
```

---

## Using the App

1. **Install Freighter** — add the browser extension, set network to Stellar Testnet
2. **Fund your wallet** — use [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_ADDRESS)
3. **Connect** — click "Connect Wallet" in the top-right corner
4. **Create a split** — enter description, total XLM amount, and participant addresses (one per line)
5. **Participants pay** — each person opens the app, connects their wallet, and clicks "Pay My Share"
6. **Auto-settle** — once all participants pay, the initiator automatically receives the full amount

---

## Security Design

| Concern | How it is handled |
|---------|-----------------|
| Authorization | `require_auth()` on every write — only the participant themselves can pay their share |
| Double payment | `paid` map checked before every transfer |
| Non-participants | Caller verified against participant list before any transfer |
| Integer dust | Last payer covers remainder; initiator always receives exactly `total_amount` |
| Stuck funds | `cancel_split` refunds all participants who already paid |
| Invalid inputs | `total_amount > 0` and non-empty participants enforced on creation |

---

## Contributing

Contributions of all sizes are welcome. Check [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Open issues:**

| Issue | Label | Difficulty |
|-------|-------|------------|
| [Add Freighter wallet connection](../../issues/1) | `good first issue` | Medium |
| [Mobile responsive dashboard](../../issues/2) | `good first issue` | Trivial |
| [Write pay_share contract tests](../../issues/4) | `help wanted` | Medium |
| [Integrate contract in CreateSplitForm](../../issues/3) | `help wanted` | High |
| [Split history page](../../issues/5) | `good first issue` | Medium |

This project participates in the **[Stellar Wave Program on Drips](https://www.drips.network)** — contributors earn points and rewards for merged pull requests.

---

## Roadmap

- [ ] Multi-token support (USDC and any SAC token)
- [ ] Split history page for past settled splits
- [ ] Email / push notifications when a participant pays
- [ ] Mainnet deployment post-audit
- [ ] Mobile app (React Native + Freighter mobile SDK)

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Resources

- [Soroban Documentation](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar JS SDK Docs](https://stellar.github.io/js-stellar-sdk/)
- [Freighter API Docs](https://docs.freighter.app)
- [Stellar Expert (Testnet Explorer)](https://stellar.expert/explorer/testnet)
- [Stellar Laboratory](https://lab.stellar.org)
- [Stellar Friendbot (get testnet XLM)](https://friendbot.stellar.org)
