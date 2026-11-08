#!/usr/bin/env node
// Runs the TypeScript CLI through tsx so the package works straight from a clone.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsx = createRequire(import.meta.url).resolve("tsx/cli");
const result = spawnSync(process.execPath, [tsx, join(root, "src/cli.ts"), ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
