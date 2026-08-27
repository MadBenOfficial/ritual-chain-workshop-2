# Canopy contracts

Hardhat 3 project for the `RitualPredict` contract. The complete architecture and runbook are in the [root README](../README.md).

## Layout

```text
contracts/RitualPredict.sol              market lifecycle and Ritual integrations
contracts/ritual/RitualChain.sol         canonical Ritual addresses and interfaces
contracts/test/RitualLocalMocks.sol      local Scheduler, wallet, registry, HTTP, and JQ
test/RitualPredict.ts                    eight unit/lifecycle tests
scripts/deploy.ts                        deploy and fund execution on Ritual testnet
scripts/create-demo-market.ts            create a preset market
scripts/status.ts                        inspect live markets and schedule state
scripts/export-abi.ts                    regenerate the frontend ABI
```

## Local verification

```bash
pnpm install
pnpm exec hardhat build
pnpm exec hardhat test
pnpm exec tsc --noEmit
```

The tests install mock runtime code at Ritual's canonical addresses with the Hardhat test client. They require no RPC, private key, or testnet balance.

## Testnet deployment

```bash
cp .env.example .env
# Add a funded RITUAL_PRIVATE_KEY.
pnpm exec hardhat run scripts/deploy.ts --network ritual
```

Never commit `.env`. The GitHub token in the workspace is unrelated to the EVM wallet required for deployment.
