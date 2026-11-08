import { describe, expect, it, vi } from "vitest";
import { assembleStoryboard, sanitizeCopy } from "../src/storyboard/assemble.ts";
import { buildBrief, type PlannerClient } from "../src/storyboard/claude.ts";
import { heuristicCopy } from "../src/storyboard/heuristic.ts";
import { planStoryboard } from "../src/storyboard/plan.ts";
import { COPY_LIMITS, type Copy, StoryboardSchema, totalFrames } from "../src/storyboard/schema.ts";
import { cleanClause, truncateWords } from "../src/storyboard/text.ts";
import { captureFor } from "./fixtures/raw.ts";

const capture = captureFor();

describe("heuristic planner", () => {
  const storyboard = assembleStoryboard(capture, heuristicCopy(capture), "heuristic", new Date("2026-11-08T00:00:00Z"));

  it("produces a schema-valid storyboard", () => {
    expect(() => StoryboardSchema.parse(storyboard)).not.toThrow();
    expect(storyboard.meta.planner).toBe("heuristic");
  });

  it("orders scenes hook → reveal → showcase → features → cta", () => {
    expect(storyboard.scenes.map((s) => s.type)).toEqual([
      "hook",
      "reveal",
      "showcase",
      "feature",
      "feature",
      "feature",
      "cta",
    ]);
  });

  it("lands between 15 and 22 seconds", () => {
    const seconds = totalFrames(storyboard) / storyboard.fps;
    expect(seconds).toBeGreaterThanOrEqual(15);
    expect(seconds).toBeLessThanOrEqual(22);
  });

  it("wires feature scenes to their screenshots", () => {
    const features = storyboard.scenes.filter((s) => s.type === "feature");
    expect(features.map((f) => f.type === "feature" && f.screenshot)).toEqual([
      "feature-0.jpg",
      "feature-1.jpg",
      "feature-2.jpg",
    ]);
  });

  it("takes theme colors from the brand", () => {
    expect(storyboard.theme.primary).toBe("#7c5cff");
    expect(storyboard.theme.dark).toBe(true);
  });

  it("never shows an ellipsis in a caption", () => {
    for (const scene of storyboard.scenes) {
      if (scene.type === "feature") expect(scene.caption ?? "").not.toContain("…");
    }
  });
});

describe("sanitizeCopy", () => {
  const copy: Copy = {
    hook: "A".repeat(200),
    tagline: "short",
    showcaseCaption: "ok",
    features: [
      { source: 1, title: "Second", caption: "x" },
      { source: 1, title: "Duplicate", caption: "x" },
      { source: 99, title: "Out of range", caption: "x" },
      { source: 0, title: "First", caption: "x" },
      { source: 2, title: "Third", caption: "x" },
    ],
    ctaHeadline: "Go",
    ctaButton: "Start",
  };
  const clean = sanitizeCopy(copy, 3);

  it("enforces hard character limits", () => {
    expect(clean.hook.length).toBeLessThanOrEqual(COPY_LIMITS.hook);
  });

  it("drops duplicate and out-of-range feature references and keeps at most three", () => {
    expect(clean.features.map((f) => f.source)).toEqual([1, 0, 2]);
  });
});

describe("planStoryboard", () => {
  const goodCopy: Copy = {
    hook: "Changelogs on autopilot",
    tagline: "Every merge becomes a note your customers read",
    showcaseCaption: "From pull request to announcement",
    features: [{ source: 2, title: "See what lands", caption: "Know which releases drive adoption" }],
    ctaHeadline: "Ship the story too",
    ctaButton: "Start free",
  };
  const clientReturning = (response: object): PlannerClient => ({
    messages: { parse: vi.fn().mockResolvedValue(response) } as unknown as PlannerClient["messages"],
  });

  it("uses the heuristic planner without credentials", async () => {
    const storyboard = await planStoryboard(capture, { hasCredentials: false });
    expect(storyboard.meta.planner).toBe("heuristic");
  });

  it("uses Claude's copy when it returns a valid result", async () => {
    const client = clientReturning({ stop_reason: "end_turn", parsed_output: goodCopy });
    const storyboard = await planStoryboard(capture, { planner: "claude", client });
    expect(storyboard.meta.planner).toBe("claude");
    expect(storyboard.scenes[0]).toMatchObject({ type: "hook", text: "Changelogs on autopilot" });
    expect(storyboard.scenes.find((s) => s.type === "feature")).toMatchObject({ screenshot: "feature-2.jpg" });
  });

  it("falls back to the heuristic planner on a refusal in auto mode", async () => {
    const log = vi.fn();
    const client = clientReturning({ stop_reason: "refusal", parsed_output: null });
    const storyboard = await planStoryboard(capture, { planner: "auto", client, log });
    expect(storyboard.meta.planner).toBe("heuristic");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("falling back"));
  });

  it("surfaces the error when Claude is explicitly requested", async () => {
    const client = clientReturning({ stop_reason: "end_turn", parsed_output: null });
    await expect(planStoryboard(capture, { planner: "claude", client })).rejects.toThrow(/schema/);
  });

  it("sends only extracted facts to the model", () => {
    const brief = buildBrief(capture);
    expect(Object.keys(brief)).toEqual([
      "product",
      "domain",
      "language",
      "headline",
      "description",
      "callToAction",
      "features",
    ]);
    expect(JSON.stringify(brief)).not.toContain("<svg");
  });
});

describe("text helpers", () => {
  it("truncates on word boundaries", () => {
    expect(truncateWords("Release notes that write themselves", 20)).toBe("Release notes that…");
  });

  it("returns the first clean clause or nothing", () => {
    expect(cleanClause("Short sentence. Second one.", 40)).toBe("Short sentence");
    expect(cleanClause("Orbit reads the pull request, the linked issue and the diff, and writes a draft.", 40)).toBe(
      "Orbit reads the pull request",
    );
    expect(cleanClause("Supercalifragilisticexpialidocious-and-more-words-without-breaks", 20)).toBeNull();
  });
});
