import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEther } from "viem";
import { network } from "hardhat";

const ADDR = {
  scheduler: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
  wallet: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948",
  registry: "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F",
  http: "0x0000000000000000000000000000000000000801",
  jq: "0x0000000000000000000000000000000000000803",
} as const;

describe("RitualPredict", async function () {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();
  const testClient = await viem.getTestClient();
  const [creator, yesUser, noUser] = await viem.getWalletClients();

  async function installCode(contractName: "MockScheduler" | "MockRitualWallet" | "MockRegistry" | "MockHttp" | "MockJq", address: `0x${string}`) {
    const source = await viem.deployContract(contractName);
    const bytecode = await publicClient.getCode({ address: source.address });
    assert.ok(bytecode);
    await testClient.setCode({ address, bytecode });
  }

  async function fixture() {
    await installCode("MockScheduler", ADDR.scheduler);
    await installCode("MockRitualWallet", ADDR.wallet);
    await installCode("MockRegistry", ADDR.registry);
    await installCode("MockHttp", ADDR.http);
    await installCode("MockJq", ADDR.jq);

    const registry = await viem.getContractAt("MockRegistry", ADDR.registry);
    const http = await viem.getContractAt("MockHttp", ADDR.http);
    const jq = await viem.getContractAt("MockJq", ADDR.jq);
    const scheduler = await viem.getContractAt("MockScheduler", ADDR.scheduler);
    await registry.write.configure(["0x000000000000000000000000000000000000bEEF", true]);
    await http.write.configure([200, 4_250n, "", false]);
    await jq.write.configure([4_250n, false]);

    const predict = await viem.deployContract("RitualPredict", [1_000n]);
    return { predict, registry, http, jq, scheduler };
  }

  const marketParams = (minimumStake = parseEther("0.05")) => ({
    question: "Will the observation reach 4,000?",
    oracleUrl: "https://oracle.example/value",
    jsonPath: ".value",
    target: 4_000n,
    minimumStake,
    comparator: 1,
    bettingSeconds: 30n,
    resolveDelaySeconds: 15n,
  } as const);

  it("creates an immutable rule and books its own resolution", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await viem.assertions.emit(predict.write.createMarket([marketParams()], { value: parseEther("0.01") }), predict, "MarketCreated");
    const market = await predict.read.getMarket([1n]);
    assert.equal(market.creator.toLowerCase(), creator.account.address.toLowerCase());
    assert.equal(market.minimumStake, parseEther("0.05"));
    assert.equal(market.scheduleId, 1n);
    assert.ok(market.resolveBlock > market.closeBlock);
    const scheduler = await viem.getContractAt("MockScheduler", ADDR.scheduler);
    assert.equal((await scheduler.read.lastPayer()).toLowerCase(), predict.address.toLowerCase());
    assert.equal(await scheduler.read.lastNumCalls(), 3);
    assert.equal(await scheduler.read.lastFrequency(), 200);
    assert.equal(await scheduler.read.lastTtl(), 150);
  });

  it("enforces the creator-defined minimum stake", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await viem.assertions.revertWithCustomError(
      predict.write.bet([1n, true], { account: yesUser.account, value: parseEther("0.01") }),
      predict,
      "StakeBelowMinimum",
    );
  });

  it("lets the creator cancel only a market with no stake", async function () {
    const { predict, scheduler } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await viem.assertions.emitWithArgs(
      predict.write.cancelUnfundedMarket([1n]),
      predict,
      "UnfundedMarketCancelled",
      [1n, creator.account.address],
    );
    assert.equal((await predict.read.getMarket([1n])).state, 4);
    assert.equal(await scheduler.read.getCallState([1n]), 3);
  });

  it("prevents cancellation after the first stake", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await predict.write.bet([1n, true], { account: yesUser.account, value: parseEther("1") });
    await viem.assertions.revertWithCustomError(
      predict.write.cancelUnfundedMarket([1n]),
      predict,
      "MarketFunded",
    );
  });

  it("resolves from mocked HTTP and JQ evidence and pays pari-mutuel winners", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await predict.write.bet([1n, true], { account: yesUser.account, value: parseEther("1") });
    await predict.write.bet([1n, false], { account: noUser.account, value: parseEther("3") });

    await networkHelpers.impersonateAccount(ADDR.scheduler);
    await networkHelpers.setBalance(ADDR.scheduler, parseEther("1"));
    const schedulerClient = await viem.getWalletClient(ADDR.scheduler);
    await viem.assertions.emitWithArgs(
      predict.write.onScheduledResolve([0n, 1n], { account: schedulerClient.account }),
      predict,
      "MarketResolved",
      [1n, 1, 4_250n],
    );

    const market = await predict.read.getMarket([1n]);
    assert.equal(market.state, 3);
    assert.equal(market.outcome, 1);
    assert.equal(market.observedValue, 4_250n);
    assert.equal((await predict.read.stakesOf([1n, yesUser.account.address]))[3], parseEther("4"));

    await viem.assertions.balancesHaveChanged(
      predict.write.claimWinnings([1n], { account: yesUser.account }),
      [
        { address: predict.address, amount: -parseEther("4") },
        { address: yesUser.account.address, amount: parseEther("4") },
      ],
    );
  });

  it("invalidates after three oracle failures and refunds both sides", async function () {
    const { predict, http } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await predict.write.bet([1n, true], { account: yesUser.account, value: parseEther("1") });
    await predict.write.bet([1n, false], { account: noUser.account, value: parseEther("2") });
    await http.write.configure([503, 0n, "upstream unavailable", false]);

    await networkHelpers.impersonateAccount(ADDR.scheduler);
    await networkHelpers.setBalance(ADDR.scheduler, parseEther("1"));
    const schedulerClient = await viem.getWalletClient(ADDR.scheduler);
    for (let executionIndex = 0n; executionIndex < 3n; executionIndex++) {
      await predict.write.onScheduledResolve([executionIndex, 1n], { account: schedulerClient.account });
    }

    const market = await predict.read.getMarket([1n]);
    assert.equal(market.state, 4);
    assert.equal(market.attempts, 3);
    assert.equal(market.invalidReason, "upstream unavailable");
    await viem.assertions.balancesHaveChanged(
      predict.write.claimRefund([1n], { account: noUser.account }),
      [
        { address: predict.address, amount: -parseEther("2") },
        { address: noUser.account.address, amount: parseEther("2") },
      ],
    );
  });

  it("never interprets an empty winning pool as a valid outcome", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await predict.write.bet([1n, false], { account: noUser.account, value: parseEther("1") });
    await networkHelpers.impersonateAccount(ADDR.scheduler);
    await networkHelpers.setBalance(ADDR.scheduler, parseEther("1"));
    const schedulerClient = await viem.getWalletClient(ADDR.scheduler);
    await predict.write.onScheduledResolve([0n, 1n], { account: schedulerClient.account });
    assert.equal((await predict.read.getMarket([1n])).state, 4);
  });

  it("opens refunds after the full Scheduler window expires without a callback", async function () {
    const { predict } = await networkHelpers.loadFixture(fixture);
    await predict.write.createMarket([marketParams()], { value: parseEther("0.01") });
    await predict.write.bet([1n, true], { account: yesUser.account, value: parseEther("1") });
    const expiry = await predict.read.resolutionExpiryBlock([1n]);
    const current = await publicClient.getBlockNumber();
    await networkHelpers.mine(expiry - current + 1n);

    await viem.assertions.emitWithArgs(
      predict.write.invalidateExpiredMarket([1n], { account: noUser.account }),
      predict,
      "MarketInvalidated",
      [1n, "scheduled resolution window expired"],
    );
    assert.equal((await predict.read.stakesOf([1n, yesUser.account.address]))[3], parseEther("1"));
  });
});
