import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors the `@/*` path alias in tsconfig.json, so lib/ modules can be
  // imported the same way from a test as from a route.
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "content/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
