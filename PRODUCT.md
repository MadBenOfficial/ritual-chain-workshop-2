# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People exploring Ritual Chain who want to create, fund, and follow binary prediction markets without relying on a centralized resolver. Reviewers also need clear evidence that the market lifecycle, oracle rule, scheduling, and payouts genuinely work.

## Product Purpose

Canopy is a self-resolving prediction-market workspace. A creator fixes a public HTTP oracle rule, a betting window, and an automatic resolution block. Participants back YES or NO with native RITUAL, then the Ritual Scheduler, HTTP precompile, and JQ precompile settle the market without a manual resolver.

Success means a newcomer can understand a market's rule, state, pool balance, and next action within seconds, while a technical reviewer can trace the on-chain mechanism and reproduce the local verification.

## Positioning

The product treats autonomous resolution as the primary interface object: every market exposes its immutable evidence rule and progresses through a visible scheduled lifecycle. It adds creator-defined minimum stakes and safe cancellation of completely unfunded markets, making workshop experimentation less noisy without introducing an administrator.

## Operating Context

The application is used in a browser with an injected wallet on Ritual Chain (chain ID 1979). The repository must also run locally with Hardhat so contract logic, scheduler wiring, oracle decoding, retries, refunds, and payouts can be verified while the public chain is unavailable.

## Capabilities and Constraints

- Binary YES/NO pari-mutuel staking with native RITUAL.
- Immutable HTTP oracle URL, JQ path, comparator, target, and scheduled resolution block.
- Three scheduled attempts; repeated oracle failure invalidates the market and enables refunds.
- Creator-selected minimum stake and creator cancellation only while the market has no stakes.
- Pull-based claims with no participant loops.
- Wallet integration and honest local/demo states; no fabricated deployment or verification claims.
- No wallet private key is available for this build, so public-chain deployment is deliberately out of scope until the account supplies one.

## Brand Commitments

The product name is Canopy. Its voice is concise, observational, and practical. The repository must remain a public GitHub fork named `ritual-chain-workshop-2`, and all new work must be independent of any other participant account, identity, repository, or contribution history.

## Evidence on Hand

The upstream workshop contract, Ritual system-address library, Hardhat scripts, and local source history are the factual starting evidence. New unit tests, local execution receipts, build output, and screenshots may be added as reproducible evidence. There is no deployed contract address or transaction hash to claim.

## Product Principles

- Make the automatic resolution path visible, not magical.
- Keep market rules immutable and inspectable.
- Prefer explicit recovery states over false outcomes.
- Make local verification first-class.
- Never imply a chain action or deployment that did not happen.

