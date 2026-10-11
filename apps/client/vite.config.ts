import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // consome o fonte ESM dos contratos; o dist CommonJS continua servindo o servidor Nest
      "@rpg/contracts": fileURLToPath(new URL("../../packages/contracts/src/index.ts", import.meta.url))
    }
  }
});
