import { parseEther } from "viem";

export type MarketView = {
  id: bigint;
  creator: `0x${string}`;
  question: string;
  oracleUrl: string;
  jsonPath: string;
  target: bigint;
  minimumStake: bigint;
  comparator: number;
  closeBlock: bigint;
  resolveBlock: bigint;
  scheduleId: bigint;
  totalYes: bigint;
  totalNo: bigint;
  state: number;
  outcome: number;
  attempts: number;
  observedValue: bigint;
  invalidReason: string;
};

export const demoMarkets: MarketView[] = [
  {
    id: 7n,
    creator: "0x7A27e932a77C18A93F61bF6B5CBa531aF17B0A21",
    question: "Will ETH/USD be at least $4,000 when this plot resolves?",
    oracleUrl: "https://api.example.org/oracle/eth-usd",
    jsonPath: ".price",
    target: 4_000n,
    minimumStake: parseEther("0.01"),
    comparator: 1,
    closeBlock: 42_018_800n,
    resolveBlock: 42_019_100n,
    scheduleId: 108n,
    totalYes: parseEther("8.4"),
    totalNo: parseEther("5.6"),
    state: 0,
    outcome: 0,
    attempts: 0,
    observedValue: 0n,
    invalidReason: "",
  },
  {
    id: 6n,
    creator: "0xD435f79dBb708E2f1b24e35A34e82139528a61B4",
    question: "Will the Ritual HTTP executor set remain above eight services?",
    oracleUrl: "https://api.example.org/ritual/executors",
    jsonPath: ".valid_http",
    target: 8n,
    minimumStake: parseEther("0.05"),
    comparator: 0,
    closeBlock: 42_016_240n,
    resolveBlock: 42_016_540n,
    scheduleId: 104n,
    totalYes: parseEther("11.25"),
    totalNo: parseEther("2.75"),
    state: 2,
    outcome: 0,
    attempts: 1,
    observedValue: 0n,
    invalidReason: "",
  },
  {
    id: 5n,
    creator: "0x415E8d119fbA86652A7d881C0C0e93Dc29823A95",
    question: "Will the sampled temperature reach 30°C before sunset?",
    oracleUrl: "https://api.example.org/weather/sample",
    jsonPath: ".temperature_c",
    target: 30n,
    minimumStake: parseEther("0.02"),
    comparator: 1,
    closeBlock: 42_010_000n,
    resolveBlock: 42_010_400n,
    scheduleId: 99n,
    totalYes: parseEther("3"),
    totalNo: parseEther("7"),
    state: 3,
    outcome: 2,
    attempts: 1,
    observedValue: 27n,
    invalidReason: "",
  },
];
