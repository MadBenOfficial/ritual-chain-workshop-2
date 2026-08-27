# Local verification record

Run date: 2026-08-27

## Contract layer

```text
$ cd hardhat
$ pnpm exec hardhat build
Compiled Solidity with solc 0.8.28 (EVM target: Cancun).

$ pnpm exec hardhat test
8 passing

$ pnpm exec tsc --noEmit
exit code 0
```

The test suite covers:

1. Immutable market rule and Scheduler booking.
2. Creator-defined minimum stake.
3. Cancellation of an unfunded market and schedule cleanup.
4. Rejection of cancellation after the first stake.
5. Mocked HTTP + JQ resolution and proportional winner payout.
6. Three oracle failures, invalidation, and full refund.
7. Empty winning side invalidation.
8. Permissionless refund opening after the full Scheduler window expires.

## Frontend layer

```text
$ cd frontend
$ pnpm run build
TypeScript: pass
Vite production build: pass (4,383 modules transformed)
```

Browser verification:

- Desktop default viewport: rendered with no console warnings or errors.
- Mobile viewport `390 × 844`: no horizontal overflow (`scrollWidth 375`, viewport content width 375).
- Every visible button met the `44 × 44` minimum target in the responsive check.
- Plot selection updated the expanded market.
- Local transaction action produced the expected honest configuration message.

## Deployment boundary

No EVM private key was present for this account. Public-chain deployment, explorer source verification, and live async execution were therefore not attempted. The frontend and documentation intentionally leave contract address and deployment transaction hash blank instead of fabricating them.
