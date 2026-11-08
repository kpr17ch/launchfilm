import { describe, expect, it } from "vitest";
import { extractContent, extractCta, extractFeatures } from "../src/content/extract.ts";
import { rawPage } from "./fixtures/raw.ts";

describe("extractContent", () => {
  const content = extractContent(rawPage());

  it("uses the h1 as tagline and the meta description", () => {
    expect(content.tagline).toBe("Release notes that write themselves");
    expect(content.description).toMatch(/^Orbit turns merged pull requests/);
  });

  it("keeps product sections in page order and drops navigation, pricing, testimonials and footer", () => {
    expect(content.features.map((f) => f.title)).toEqual([
      "Drafts from every merge",
      "Publish everywhere at once",
      "Know what customers read",
    ]);
  });

  it("carries the section visual through", () => {
    expect(content.features[2]?.visual).toEqual({ x: 700, y: 2450, width: 480, height: 320 });
  });
});

describe("extractFeatures", () => {
  it("deduplicates repeated headings and respects the limit", () => {
    const raw = rawPage();
    raw.headings.push({ ...raw.headings[2]!, y: 5000 });
    expect(extractFeatures(raw, 2)).toHaveLength(2);
    expect(extractFeatures(raw).filter((f) => f.title === "Drafts from every merge")).toHaveLength(1);
  });

  it("rejects headings that read like paragraphs", () => {
    const raw = rawPage({
      headings: [
        {
          level: 2,
          text: "This is a very long heading that is really a sentence pretending to be a title",
          body: null,
          y: 100,
          inNav: false,
          inFooter: false,
          visual: null,
        },
      ],
    });
    expect(extractFeatures(raw)).toEqual([]);
  });
});

describe("extractCta", () => {
  it("skips log-in links and picks the hero call to action", () => {
    expect(extractCta(rawPage()).label).toBe("Start free");
  });

  it("falls back to a neutral label", () => {
    expect(extractCta(rawPage({ buttons: [] }))).toEqual({ label: "Get started", href: null });
  });
});
