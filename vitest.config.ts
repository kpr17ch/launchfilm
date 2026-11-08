import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Browser-driven tests live in tests/e2e and run with `npm run test:e2e`.
    include: process.env.LAUNCHFILM_E2E ? ["tests/e2e/**/*.test.ts"] : ["tests/**/*.test.ts"],
    exclude: process.env.LAUNCHFILM_E2E ? [] : ["tests/e2e/**"],
    testTimeout: 30_000,
  },
});
