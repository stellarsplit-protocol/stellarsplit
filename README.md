# StellarSplit ✦

**Decentralized group bill splitting on the Stellar network powered by Soroban smart contracts.**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple)](https://soroban.stellar.org)

## Overview

StellarSplit lets groups split expenses and settle payments trustlessly. No middlemen, no "I'll Venmo you later" — the Soroban smart contract holds funds and auto-releases when all parties have paid their share.

### Key Features

- **Trustless** — Soroban contracts handle fund custody and release
- **Instant** — Stellar settles transactions in 3–5 seconds
- **Cheap** — Fractions of a cent per transaction
- **Open source** — Fully auditable and community-driven

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust + Soroban SDK |
| Frontend | Next.js 15 + TypeScript |
| Styling | Tailwind CSS |
| Network | Stellar Testnet / Mainnet |

## Getting Started

### Prerequisites

- Node.js 18+
- Rust + `cargo`
- Stellar CLI (`stellar`)

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
cd contracts
cargo build
cargo test
```

To deploy to testnet:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellarsplit.wasm \
  --source <your-account> \
  --network testnet
```

## Contract Architecture

The `StellarSplitContract` exposes four functions:

| Function | Description |
|----------|-------------|
| `create_split` | Create a new split with participants and total amount |
| `pay_share` | Pay your portion of a split |
| `get_split` | Fetch split details by ID |
| `split_count` | Get total number of splits created |

## Contributing

We welcome contributions! Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Good places to start:
- Browse [open issues](https://github.com/daniella-techie/stellarsplit/issues)
- Issues labeled `good first issue` are beginner-friendly
- Issues labeled `help wanted` need community attention

This project participates in the **Stellar Wave Program on Drips** — contributors earn points and rewards for merged pull requests.

## License

MIT — see [LICENSE](./LICENSE)
