import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/ritual-chain-workshop-2/",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 4173 },
});
