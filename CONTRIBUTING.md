# Contributing to StellarSplit

Thank you for your interest in contributing to StellarSplit! This project participates in the **Stellar Wave Program on Drips**, so contributors can earn rewards for their work.

## How to Contribute

1. **Fork** this repository
2. **Clone** your fork locally
3. Create a **feature branch**: `git checkout -b feat/your-feature`
4. Make your changes
5. **Test** your changes
6. Open a **Pull Request** against `main`

## Finding Issues to Work On

- Issues labeled [`good first issue`](https://github.com/daniella-techie/stellarsplit/labels/good%20first%20issue) — great for newcomers
- Issues labeled [`help wanted`](https://github.com/daniella-techie/stellarsplit/labels/help%20wanted) — open for anyone to pick up
- Issues labeled [`soroban`](https://github.com/daniella-techie/stellarsplit/labels/soroban) — smart contract work

## Issue Complexity & Drips Points

This repo is enrolled in the Stellar Wave Program:

| Label | Points |
|-------|--------|
| `complexity: trivial` | 100 pts |
| `complexity: medium` | 150 pts |
| `complexity: high` | 200 pts |

## Development Setup

### Frontend

```bash
npm install
npm run dev       # start dev server
npm run build     # production build
npm run lint      # lint check
```

### Smart Contracts

```bash
cd contracts
cargo build
cargo test
cargo clippy      # lint
```

## Code Style

- **TypeScript**: Follow existing patterns, use strict types
- **Rust**: Run `cargo fmt` and `cargo clippy` before pushing
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Questions?

Open a [GitHub Discussion](https://github.com/daniella-techie/stellarsplit/discussions) or drop a comment on any issue.
