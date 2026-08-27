# Canopy — self-resolving markets on Ritual Chain

[**Open the live Canopy interface →**](https://madbenofficial.github.io/ritual-chain-workshop-2/)

The GitHub Pages deployment runs in `LOCAL SAMPLE` mode until a Ritual Chain contract address is configured.

Canopy is an independent extension of Bootcamp 2's prediction-market workshop. A market creator fixes a question, an HTTP oracle, a JQ extraction path, a numeric threshold, and a resolution block. Participants stake native RITUAL on YES or NO. After betting closes, the Ritual Scheduler wakes the contract and the market resolves itself — there is no privileged resolver and no backend cron.

This repository is intentionally useful while the public chain is unavailable: the complete contract lifecycle runs locally against Ritual-compatible mocks installed at the canonical system and precompile addresses.

![Canopy interface direction](docs/design/canopy-north-star.png)

## What is different in this fork

- Completed every workshop TODO: market creation, scheduling, executor selection, HTTP response decoding, JQ extraction, retries, resolution, invalidation, payouts, and refunds.
- Added a creator-defined minimum stake to reduce dust and accidental micro-bets.
- Required each creator to fund the execution reserve for the three scheduled attempts, preventing free schedule spam against the shared contract balance.
- Added `cancelUnfundedMarket`: the creator can cancel an abandoned market only before the first stake. A funded market can never be cancelled.
- Added a permissionless expiry escape hatch so a skipped or unfunded Scheduler job can never lock participant stakes forever.
- Replaced the starter `Counter` test with eight local market tests, including canonical-address mocks for Scheduler, RitualWallet, TEE registry, HTTP, and JQ.
- Added Canopy, a responsive React interface with wallet/chain guards, contract reads, real stake transactions when configured, and an explicit local-sample mode when it is not deployed.
- Added reproducible architecture, design, and verification records.

## How autonomous resolution works

```text
createMarket
    │
    ├─ stores an immutable oracle rule
    └─ Scheduler.schedule(resolveBlock, 3 attempts)
                         │
                         ▼
                onScheduledResolve
                         │
          TEE registry selects HTTP executor
                         │
              HTTP 0x0801 fetches JSON
                         │
               JQ 0x0803 extracts uint
                         │
         compare observed value to target
              │                     │
          Resolved              3 failures
       winner pulls payout      Invalid → refunds
```

The HTTP request uses Ritual's 13-field ABI and unwraps the short-running async envelope `(simulatedInput, actualOutput)`. An oracle error is never converted into a NO result. If all attempts fail, or the winning side has no stake, the market becomes refundable.

## Run it locally

Requirements: Node.js 20+ and pnpm.

```bash
cd hardhat
pnpm install
pnpm exec hardhat build
pnpm exec hardhat test
pnpm exec tsc --noEmit

cd ../frontend
pnpm install
pnpm run build
pnpm dev
```

Open `http://127.0.0.1:4173`. With no contract address, Canopy enters an honest `LOCAL SAMPLE` mode: values are illustrative and transaction actions explain what configuration is missing.

## Connect the frontend to a deployment

Copy `frontend/.env.example` to `frontend/.env.local` and set:

```bash
VITE_RITUAL_RPC_URL=https://rpc.ritualfoundation.org
VITE_PREDICT_ADDRESS=0xYourDeployedContract
```

The client uses Ritual Chain ID `1979`, reads `getMarkets()` every five seconds, prompts network switching, and sends regular `bet` contract transactions with the generated ABI.

## Optional Ritual testnet deployment

Deployment needs a separate funded EVM wallet; the GitHub token is not a wallet and cannot sign chain transactions.

```bash
cd hardhat
cp .env.example .env
# Set RITUAL_PRIVATE_KEY in hardhat/.env, then fund it from the Ritual faucet.
pnpm exec hardhat run scripts/deploy.ts --network ritual
```

The deploy script measures block time, deploys `RitualPredict`, and deposits the configured execution funding into RitualWallet. No private key was supplied for this submission, so this repository does not claim a deployed address or transaction hash.

## Verified locally

The proof record is in [docs/proof/local-verification.md](docs/proof/local-verification.md). Current checks:

- Solidity compilation: pass
- Eight contract/lifecycle tests: pass
- Hardhat TypeScript check: pass
- Frontend production build: pass
- Desktop and 390px responsive browser checks: pass, no console errors or horizontal overflow
- GitHub-account identity scan: performed before push

## Project map

```text
hardhat/contracts/RitualPredict.sol       market state machine and Ritual calls
hardhat/contracts/ritual/RitualChain.sol  canonical addresses and interfaces
hardhat/contracts/test/                   local Ritual-compatible mocks
hardhat/test/RitualPredict.ts             seven lifecycle tests
hardhat/scripts/                          deploy, funding, status, and ABI export
frontend/src/                             Canopy React interface
.ritual-build/                            Ritual capability projection and checkpoint
PRODUCT.md / DESIGN.md                    durable product and visual decisions
docs/proof/                               reproducible build evidence
```

## Ritual references

- [Ritual documentation](https://docs.ritualfoundation.org)
- [Ritual explorer](https://explorer.ritualfoundation.org)
- [Ritual faucet](https://faucet.ritualfoundation.org)
