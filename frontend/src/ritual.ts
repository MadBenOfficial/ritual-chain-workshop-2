import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain, isAddress } from "viem";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RITUAL_RPC_URL || "https://rpc.ritualfoundation.org"] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" },
  },
});

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  connectors: [injected()],
  transports: { [ritualChain.id]: http() },
});

const configuredAddress = import.meta.env.VITE_PREDICT_ADDRESS as string | undefined;
export const predictAddress = configuredAddress && isAddress(configuredAddress)
  ? configuredAddress
  : undefined;
