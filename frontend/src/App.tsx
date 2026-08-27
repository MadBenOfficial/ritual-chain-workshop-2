/*
THESIS: Canopy turns autonomous resolution into an observable field ledger and refuses the trading-terminal dashboard.
OWN-WORLD: Black soil, clipped specimen tags, measured furrows, and semantic Ritual color on an unequal row system.
STORY: Pick a plot, inspect its immutable evidence, understand the scheduled attempts, then stake or recover funds.
FIRST VIEWPORT: A compact index leads into one expanded market row; its pool bed and oracle label share the center, with the block ruler at right.
FORM: The seventh grounded direction, a phenology field ledger, staged as an in-place workbench; seed c5d2826e.
*/
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBlockNumber,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther, parseEther, zeroAddress } from "viem";
import { demoMarkets, type MarketView } from "./demo";
import { predictAbi } from "./predict-abi";
import { predictAddress, ritualChain } from "./ritual";

const STATE = ["Open", "Closed", "Resolving", "Resolved", "Invalid"] as const;
const OUTCOME = ["Unresolved", "YES", "NO"] as const;
const COMPARATOR = [">", "≥", "<", "≤"] as const;

function compact(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function amount(value: bigint, digits = 2) {
  return Number(formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function stateTone(state: number) {
  if (state === 3) return "verified";
  if (state === 4) return "failed";
  if (state === 1 || state === 2) return "pending";
  return "open";
}

function normalizeMarkets(data: readonly unknown[] | undefined): MarketView[] {
  if (!data) return [];
  return data.map((entry) => {
    const m = entry as Record<string, unknown>;
    return {
      id: m.id as bigint,
      creator: m.creator as `0x${string}`,
      question: m.question as string,
      oracleUrl: m.oracleUrl as string,
      jsonPath: m.jsonPath as string,
      target: m.target as bigint,
      minimumStake: m.minimumStake as bigint,
      comparator: Number(m.comparator),
      closeBlock: m.closeBlock as bigint,
      resolveBlock: m.resolveBlock as bigint,
      scheduleId: m.scheduleId as bigint,
      totalYes: m.totalYes as bigint,
      totalNo: m.totalNo as bigint,
      state: Number(m.state),
      outcome: Number(m.outcome),
      attempts: Number(m.attempts),
      observedValue: m.observedValue as bigint,
      invalidReason: m.invalidReason as string,
    };
  });
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4 39 13v22l-15 9L9 35V13Z" />
      <path d="M24 11v26M24 18l-8-5M24 25l10-7M24 31l-7 5" />
    </svg>
  );
}

function App() {
  const configured = Boolean(predictAddress);
  const [selectedId, setSelectedId] = useState(7n);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [stake, setStake] = useState("0.10");
  const [notice, setNotice] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContract, data: txHash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const marketRead = useReadContract({
    address: predictAddress ?? zeroAddress,
    abi: predictAbi,
    functionName: "getMarkets",
    query: { enabled: configured, refetchInterval: 5_000 },
  });

  const liveMarkets = normalizeMarkets(marketRead.data as readonly unknown[] | undefined);
  const markets = configured ? liveMarkets : demoMarkets;
  const liveReady = configured && marketRead.isSuccess;

  useEffect(() => {
    if (markets.length && !markets.some((market) => market.id === selectedId)) {
      setSelectedId(markets[0].id);
    }
  }, [markets, selectedId]);

  useEffect(() => {
    if (isConfirmed) {
      setNotice("Transaction confirmed. The plot will refresh from Ritual Chain.");
      void marketRead.refetch();
    }
  }, [isConfirmed]);

  const active = markets.find((market) => market.id === selectedId) ?? markets[0];
  const { data: currentBlock } = useBlockNumber({
    watch: true,
    query: { enabled: configured },
  });
  const stakesRead = useReadContract({
    address: predictAddress ?? zeroAddress,
    abi: predictAbi,
    functionName: "stakesOf",
    args: [active?.id ?? 0n, address ?? zeroAddress],
    query: { enabled: configured && Boolean(active) && Boolean(address), refetchInterval: 5_000 },
  });

  if (!active) {
    const readingState = marketRead.isPending
      ? "Reading the deployed market contract…"
      : marketRead.error
        ? "The configured contract could not be read. Check its address, RPC, and chain."
        : "The deployed contract contains no markets yet.";
    return (
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="Canopy home"><BrandMark /><span>CANOPY</span></a>
          <div className="station-line"><span className="status-hole pending" /><span>Ritual contract check</span><span className="mono">CHAIN 1979</span></div>
          <button className="wallet-button" type="button" onClick={() => isConnected ? disconnect() : connectors[0] && connect({ connector: connectors[0] })}>
            <span aria-hidden="true">◇</span>{isConnected && address ? `Disconnect ${compact(address)}` : "Connect wallet"}
          </button>
        </header>
        <main id="top"><section className="connection-state" role={marketRead.error ? "alert" : "status"}><p className="tag">DEPLOYED CONTRACT</p><h1>{readingState}</h1><p className="mono">{predictAddress}</p>{marketRead.error && <button className="primary-action" onClick={() => void marketRead.refetch()}>Retry contract read</button>}</section></main>
      </div>
    );
  }
  const total = active.totalYes + active.totalNo;
  const yesShare = total === 0n ? 50 : Number((active.totalYes * 10_000n) / total) / 100;
  const noShare = 100 - yesShare;
  const canStake = configured && isConnected && chainId === ritualChain.id && active.state === 0;
  const stakeData = stakesRead.data as readonly [bigint, bigint, boolean, bigint] | undefined;
  const alreadySettled = stakeData?.[2] ?? false;
  const claimable = stakeData?.[3] ?? 0n;
  const isCreator = Boolean(address && address.toLowerCase() === active.creator.toLowerCase());
  const canCancel = configured && isConnected && isCreator && active.state === 0 && total === 0n;
  const resolutionSpan = active.resolveBlock > active.closeBlock ? active.resolveBlock - active.closeBlock : 1n;
  const resolutionProgress = currentBlock
    ? Math.max(0, Math.min(1, Number(currentBlock - active.closeBlock) / Number(resolutionSpan)))
    : 0.5;
  const markerPosition = `${28 + resolutionProgress * 44}%`;

  const actionLabel = useMemo(() => {
    if (!configured) return "Configure contract to stake";
    if (!isConnected) return "Connect wallet to stake";
    if (chainId !== ritualChain.id) return "Switch to Ritual Chain";
    if (active.state !== 0) return "This plot is no longer open";
    if (isWriting) return "Confirm in wallet…";
    if (isConfirming) return "Growing commitment…";
    return `Stake ${stake || "0"} RITUAL on ${side.toUpperCase()}`;
  }, [active.state, chainId, configured, isConnected, isConfirming, isWriting, side, stake]);

  function submitStake(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    if (!configured) return setNotice("Local sample only. Deploy the contract and set VITE_PREDICT_ADDRESS first.");
    if (!isConnected) return connectors[0] && connect({ connector: connectors[0] });
    if (chainId !== ritualChain.id) return switchChain({ chainId: ritualChain.id });
    try {
      const value = parseEther(stake);
      if (value < active.minimumStake) {
        return setNotice(`Minimum stake is ${amount(active.minimumStake)} RITUAL.`);
      }
      writeContract({
        address: predictAddress!,
        abi: predictAbi,
        functionName: "bet",
        args: [active.id, side === "yes"],
        value,
      });
    } catch {
      setNotice("Enter a valid RITUAL amount.");
    }
  }

  function submitRecovery() {
    setNotice("");
    if (!configured || !isConnected) return;
    if (chainId !== ritualChain.id) return switchChain({ chainId: ritualChain.id });
    if (active.state === 3) {
      writeContract({ address: predictAddress!, abi: predictAbi, functionName: "claimWinnings", args: [active.id] });
    } else if (active.state === 4) {
      writeContract({ address: predictAddress!, abi: predictAbi, functionName: "claimRefund", args: [active.id] });
    }
  }

  function cancelPlot() {
    setNotice("");
    if (!canCancel) return;
    if (chainId !== ritualChain.id) return switchChain({ chainId: ritualChain.id });
    writeContract({ address: predictAddress!, abi: predictAbi, functionName: "cancelUnfundedMarket", args: [active.id] });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Canopy home">
          <BrandMark />
          <span>CANOPY</span>
        </a>
        <div className="station-line" aria-label="Application status">
          <span className={`status-hole ${liveReady ? "verified" : "pending"}`} />
          <span>{liveReady ? "Ritual field station" : configured ? "Reading Ritual contract" : "Local field sample"}</span>
          <span className="mono">CHAIN 1979</span>
        </div>
        <button
          className="wallet-button"
          type="button"
          onClick={() => {
            if (isConnected) disconnect();
            else if (connectors[0]) connect({ connector: connectors[0] });
          }}
          disabled={isConnecting}
        >
          <span aria-hidden="true">◇</span>
          {isConnected && address ? `Disconnect ${compact(address)}` : isConnecting ? "Connecting…" : "Connect wallet"}
        </button>
      </header>

      {!configured && (
        <div className="sample-band" role="status">
          <strong>LOCAL SAMPLE</strong>
          <span>All values below are illustrative. No deployment or chain transaction is being claimed.</span>
          <a href="#mechanism">See local verification</a>
        </div>
      )}

      <main id="top">
        <section className="ledger-heading" aria-labelledby="ledger-title">
          <div>
            <p className="tag">FIELD LEDGER · {markets.length} PLOTS</p>
            <h1 id="ledger-title">Watch evidence become an outcome.</h1>
          </div>
          <p className="ledger-intro">
            Each plot fixes its rule at creation. Ritual schedules the observation, reads the public
            oracle in a TEE, extracts one number with JQ, and settles without a resolver button.
          </p>
        </section>

        <section className="market-ledger" aria-label="Prediction market plots">
          <div className="ledger-columns" aria-hidden="true">
            <span>Plot / question</span><span>Pool</span><span>Phase</span><span>Resolution block</span>
          </div>
          {markets.map((market) => {
            const marketTotal = market.totalYes + market.totalNo;
            const selected = market.id === active.id;
            return (
              <button
                key={market.id.toString()}
                type="button"
                className={`market-row ${selected ? "selected" : ""}`}
                onClick={() => setSelectedId(market.id)}
                aria-pressed={selected}
              >
                <span className="plot-id"><i className={`status-hole ${stateTone(market.state)}`} />P-{market.id.toString().padStart(3, "0")}</span>
                <span className="row-question">{market.question}</span>
                <span className="row-pool mono">{amount(marketTotal)} RITUAL</span>
                <span className={`state-label ${stateTone(market.state)}`}>{STATE[market.state]}</span>
                <span className="row-block mono">{market.resolveBlock.toLocaleString()}</span>
                <span className="row-arrow" aria-hidden="true">{selected ? "−" : "+"}</span>
              </button>
            );
          })}

          <article className="active-plot" aria-labelledby="active-question">
            <div className="plot-title">
              <span className="notched-label">P-{active.id.toString().padStart(3, "0")}</span>
              <div>
                <p className="tag">ACTIVE OBSERVATION</p>
                <h2 id="active-question">{active.question}</h2>
              </div>
              <div className={`state-stamp ${stateTone(active.state)}`}>
                <span className={`status-hole ${stateTone(active.state)}`} />
                {STATE[active.state]}
              </div>
            </div>

            <div className="workbench">
              <section className="pool-bed" aria-labelledby="pool-heading">
                <div className="section-label">
                  <h3 id="pool-heading">Pool distribution</h3>
                  <span className="mono">{amount(total)} RITUAL TOTAL</span>
                </div>
                <div className="pool-measure" style={{ "--yes-share": `${yesShare}%` } as React.CSSProperties}>
                  <div className="yes-measure">
                    <span>YES</span><strong>{yesShare.toFixed(1)}%</strong><small>{amount(active.totalYes)} RITUAL</small>
                  </div>
                  <div className="origin" aria-hidden="true"><i /></div>
                  <div className="no-measure">
                    <span>NO</span><strong>{noShare.toFixed(1)}%</strong><small>{amount(active.totalNo)} RITUAL</small>
                  </div>
                </div>

                <form className="stake-bench" onSubmit={submitStake}>
                  <fieldset>
                    <legend>Choose a side</legend>
                    <button type="button" aria-pressed={side === "yes"} className={side === "yes" ? "chosen" : ""} onClick={() => setSide("yes")}>YES</button>
                    <button type="button" aria-pressed={side === "no"} className={side === "no" ? "chosen" : ""} onClick={() => setSide("no")}>NO</button>
                  </fieldset>
                  <label>
                    <span>Stake amount</span>
                    <span className="amount-input"><input inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} aria-describedby="minimum-stake" /><b>RITUAL</b></span>
                  </label>
                  <p id="minimum-stake" className="minimum">Minimum {amount(active.minimumStake)} RITUAL</p>
                  <button className="primary-action" type="submit" disabled={isWriting || isConfirming || (configured && active.state !== 0)}>
                    {chainId !== ritualChain.id && isConnected ? (isSwitching ? "Switching…" : "Switch to Ritual Chain") : actionLabel}
                  </button>
                  {(notice || writeError) && <p className="action-note" role="alert">{notice || writeError?.message.split("\n")[0]}</p>}
                </form>
                {configured && isConnected && (active.state === 3 || active.state === 4) && (
                  <div className="recovery-bench">
                    <div><span className="tag">AVAILABLE RECOVERY</span><b>{alreadySettled ? "Already settled" : `${amount(claimable)} RITUAL claimable`}</b></div>
                    <button className="primary-action" type="button" onClick={submitRecovery} disabled={alreadySettled || claimable === 0n || isWriting || isConfirming}>
                      {chainId !== ritualChain.id ? "Switch to Ritual Chain" : active.state === 3 ? "Claim winnings" : "Claim refund"}
                    </button>
                  </div>
                )}
                {canCancel && (
                  <div className="recovery-bench cancel-bench">
                    <div><span className="tag">CREATOR CONTROL</span><b>No stakes have entered this plot.</b></div>
                    <button type="button" onClick={cancelPlot} disabled={isWriting || isConfirming}>{chainId !== ritualChain.id ? "Switch to Ritual Chain" : "Cancel unfunded plot"}</button>
                  </div>
                )}
              </section>

              <section className="evidence-label" aria-labelledby="evidence-heading">
                <div className="section-label">
                  <h3 id="evidence-heading">Immutable evidence</h3>
                  <span className="oracle-chip">HTTP → JQ</span>
                </div>
                <dl>
                  <div><dt>Source</dt><dd className="oracle-text">{active.oracleUrl}</dd></div>
                  <div><dt>JQ path</dt><dd className="oracle-text">{active.jsonPath}</dd></div>
                  <div><dt>Rule</dt><dd className="mono datum">observed {COMPARATOR[active.comparator]} {active.target.toString()}</dd></div>
                  <div><dt>Creator</dt><dd className="mono">{compact(active.creator)}</dd></div>
                </dl>
                <div className="attempts" aria-label={`${active.attempts} of 3 resolution attempts used`}>
                  {[1, 2, 3].map((attempt) => (
                    <span key={attempt} className={attempt <= active.attempts ? "used" : ""}>
                      <i /> Attempt {attempt}
                    </span>
                  ))}
                </div>
                {active.state === 3 && (
                  <p className="result-note verified"><b>Verified outcome: {OUTCOME[active.outcome]}</b><span>Observed value {active.observedValue.toString()}</span></p>
                )}
                {active.state === 4 && (
                  <p className="result-note failed"><b>Refund path open</b><span>{active.invalidReason || "Resolution could not be completed."}</span></p>
                )}
              </section>

              <aside className="block-ruler" aria-label="Resolution schedule">
                <p className="tag">SEASONAL BLOCK RULER</p>
                <div className="ruler-scale" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
                <div className="ruler-reading">
                  <span>Betting closes</span><b>{active.closeBlock.toLocaleString()}</b>
                  <span>Resolution starts</span><b>{active.resolveBlock.toLocaleString()}</b>
                  <span>Schedule ID</span><b>#{active.scheduleId.toString()}</b>
                </div>
                <div className="ruler-marker" style={{ top: configured ? markerPosition : "49%" }}><span /> {configured ? `BLOCK ${currentBlock?.toLocaleString() ?? "…"}` : "LOCAL SAMPLE POSITION"}</div>
              </aside>
            </div>

            <ol className="lifecycle" aria-label="Market lifecycle">
              {[
                ["Created", "Rule fixed"],
                ["Open", "Collecting stakes"],
                ["Scheduled", "Three attempts"],
                ["Evidence", "HTTP + JQ"],
                ["Settlement", "Claim or refund"],
              ].map(([title, detail], index) => (
                <li key={title} className={index <= (active.state === 0 ? 1 : active.state === 2 ? 3 : active.state >= 3 ? 4 : 2) ? "reached" : ""}>
                  <i>{index + 1}</i><b>{title}</b><span>{detail}</span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        <section className="mechanism" id="mechanism" aria-labelledby="mechanism-title">
          <div className="mechanism-copy">
            <p className="tag">LOCAL PROOF PATH</p>
            <h2 id="mechanism-title">The resolver is a route, not a role.</h2>
            <p>Every branch is testable without inventing a deployment. The local suite installs Ritual-compatible mocks at the canonical addresses and exercises the complete market state machine.</p>
          </div>
          <ol className="route-map">
            <li><b>Scheduler</b><span className="mono">0x56e7…D58B</span></li>
            <li><b>HTTP executor</b><span className="mono oracle-text">0x0801</span></li>
            <li><b>JQ extraction</b><span className="mono oracle-text">0x0803</span></li>
            <li><b>Pull settlement</b><span>Winner claim / full refund</span></li>
          </ol>
        </section>
      </main>

      <footer>
        <span><BrandMark /> CANOPY</span>
        <span>Built for Ritual Chain · Chain ID 1979</span>
        <a href="https://docs.ritualfoundation.org" target="_blank" rel="noreferrer">Ritual documentation ↗</a>
      </footer>
    </div>
  );
}

export default App;
