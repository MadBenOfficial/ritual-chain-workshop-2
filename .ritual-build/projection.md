# Ritual-native projection

## Product mechanism

Canopy is a binary pari-mutuel market whose resolution rule is fixed when the market is created. The contract schedules its own wake-up, fetches a public oracle in a TEE-backed HTTP execution, extracts one unsigned integer with JQ, compares it against the target, and settles without a privileged resolver.

## Capability map

| Capability | Ritual primitive | Integration |
| --- | --- | --- |
| Automatic wake-up and retries | Scheduler system contract | Three executions booked at creation; remaining calls cancelled after success |
| Public evidence retrieval | HTTP precompile `0x0801` | GET request with 13-field ABI and a registry-selected executor |
| Deterministic extraction | JQ precompile `0x0803` | Synchronous `uint256` extraction from response JSON |
| Executor discovery | TEE Service Registry | Bounded valid-capability selection with a per-attempt seed |
| Execution fees | RitualWallet | Each creator supplies the reserve for their market's scheduled attempts |
| Market safety | Solidity state machine | Retry-to-invalid, expiry escape hatch, refunds, pull payouts, minimum stakes, unfunded cancellation |

## Async model

The Scheduler invokes `onScheduledResolve(executionIndex, marketId)`. Inside that scheduled transaction, HTTP follows Ritual's short-running async replay model; the fulfilled response is unwrapped from `(simulatedInput, actualOutput)`. JQ then runs synchronously. Failures never become a NO outcome: they consume an attempt and ultimately make the market refundable.

## Verification tiers

T1 covers compilation, contract tests, TypeScript checks, frontend build, and identity scans. T2 RPC checks run only if Ritual Chain is reachable. T3 deployment and explorer verification are skipped without a wallet private key. The README must report that boundary plainly.
