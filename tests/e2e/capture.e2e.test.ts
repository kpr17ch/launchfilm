import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM helper shared with `npm run example:serve`
import { serveExample } from "../../scripts/serve-example.mjs";
import { capturePage } from "../../src/capture/capture.ts";
import type { CaptureResult } from "../../src/capture/result.ts";
import { planStoryboard } from "../../src/storyboard/plan.ts";

/** Real browser, real page: captures the bundled Orbit example end to end (no network needed). */
describe("capture the Orbit example", () => {
  let server: Server;
  let dir: string;
  let capture: CaptureResult;

  beforeAll(async () => {
    server = await serveExample("orbit", 4199);
    dir = await mkdtemp(path.join(tmpdir(), "launchfilm-e2e-"));
    capture = await capturePage("http://127.0.0.1:4199/", { outDir: dir, fonts: false });
  }, 90_000);

  afterAll(async () => {
    server?.close();
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("extracts the brand", () => {
    expect(capture.brand.name).toBe("Orbit");
    expect(capture.brand.dark).toBe(true);
    expect(capture.brand.palette.primary).toBe("#7c5cff");
    expect(capture.brand.fonts.heading).toBe("Manrope");
  });

  it("extracts the product story", () => {
    expect(capture.content.tagline).toBe("Release notes that write themselves");
    expect(capture.content.features.map((f) => f.title)).toEqual([
      "Drafts from every merge",
      "Publish everywhere at once",
      "Know what customers read",
    ]);
    expect(capture.content.cta.label).toBe("Start free");
  });

  it("writes screenshots and the inline SVG logo", () => {
    expect(capture.assets.logo).toBe("logo.svg");
    for (const file of ["hero.jpg", "page.jpg", "logo.svg", "feature-0.jpg", "capture.json"].map((f) =>
      f === "capture.json" ? path.join(dir, f) : path.join(dir, "assets", f),
    )) {
      expect(existsSync(file), file).toBe(true);
    }
  });

  it("finds the illustration of each feature section", () => {
    expect(capture.content.features.every((f) => f.visual !== null)).toBe(true);
  });

  it("plans a valid storyboard from the capture", async () => {
    const storyboard = await planStoryboard(capture, { planner: "heuristic" });
    expect(storyboard.scenes.filter((s) => s.type === "feature")).toHaveLength(3);
  });
});
