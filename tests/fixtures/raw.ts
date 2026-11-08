import { extractBrand } from "../../src/brand/extract.ts";
import type { CaptureResult } from "../../src/capture/result.ts";
import type { RawHeading, RawPage } from "../../src/capture/types.ts";
import { extractContent } from "../../src/content/extract.ts";

/** A RawPage as the collector would return it for a typical dark SaaS landing page. */
export function rawPage(overrides: Partial<RawPage> = {}): RawPage {
  const heading = (h: Partial<RawHeading> & Pick<RawHeading, "text" | "y">): RawHeading => ({
    level: 2,
    body: null,
    inNav: false,
    inFooter: false,
    visual: null,
    ...h,
  });
  return {
    url: "https://www.orbit.dev/",
    title: "Orbit – Release notes that write themselves",
    lang: "en",
    meta: {
      description:
        "Orbit turns merged pull requests into polished changelogs. Your team ships; Orbit tells your customers.",
      ogTitle: null,
      ogSiteName: null,
      ogImage: null,
      themeColor: "#7c5cff",
    },
    icons: [{ href: "https://www.orbit.dev/favicon.png", rel: "icon", sizes: "32x32" }],
    logos: [
      {
        kind: "svg",
        src: null,
        markup: "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
        alt: "Orbit logo",
        x: 32,
        y: 20,
        width: 30,
        height: 30,
        inHeader: true,
      },
    ],
    headings: [
      heading({ level: 2, text: "Product", y: 10, inNav: true }),
      heading({
        level: 1,
        text: "Release notes that write themselves",
        y: 220,
        body: "Orbit turns merged pull requests into changelogs.",
      }),
      heading({
        text: "Drafts from every merge",
        y: 1400,
        body: "Orbit reads the pull request and writes a draft in your voice.",
      }),
      heading({
        text: "Publish everywhere at once",
        y: 1950,
        body: "One click sends the release to your changelog page, email and Slack.",
      }),
      heading({ text: "Loved by product teams", y: 2600 }),
      heading({ text: "Know what customers read", y: 2500, visual: { x: 700, y: 2450, width: 480, height: 320 } }),
      heading({ text: "Pricing", y: 3100 }),
      heading({ text: "Company", y: 3600, inFooter: true }),
    ],
    buttons: [
      {
        text: "Log in",
        background: "rgba(0, 0, 0, 0)",
        color: "rgb(238, 240, 255)",
        y: 20,
        width: 60,
        height: 36,
        href: "/login",
      },
      {
        text: "Start free",
        background: "rgb(124, 92, 255)",
        color: "rgb(255, 255, 255)",
        y: 420,
        width: 140,
        height: 48,
        href: "/start",
      },
      {
        text: "Watch the demo",
        background: "rgba(0, 0, 0, 0)",
        color: "rgb(238, 240, 255)",
        y: 420,
        width: 170,
        height: 48,
        href: "/demo",
      },
    ],
    colors: [
      { color: "rgb(10, 11, 20)", area: 1440 * 2700, kind: "background" },
      { color: "rgb(18, 20, 42)", area: 1040 * 460, kind: "background" },
      { color: "rgb(124, 92, 255)", area: 140 * 48, kind: "background" },
      { color: "rgb(46, 230, 197)", area: 4000, kind: "text" },
      { color: "rgb(238, 240, 255)", area: 90000, kind: "text" },
      { color: "rgb(157, 163, 199)", area: 40000, kind: "text" },
    ],
    fonts: [
      { family: '"Manrope", system-ui, sans-serif', role: "heading", weight: 800 },
      { family: "Manrope, system-ui, sans-serif", role: "body", weight: 400 },
    ],
    pageBackground: "rgb(10, 11, 20)",
    viewport: { width: 1440, height: 900 },
    documentHeight: 3800,
    ...overrides,
  };
}

export function captureFor(raw: RawPage = rawPage()): CaptureResult {
  const content = extractContent(raw);
  return {
    version: 1,
    capturedAt: "2026-11-08T00:00:00.000Z",
    raw,
    brand: extractBrand(raw),
    content,
    assets: {
      hero: "hero.jpg",
      page: "page.jpg",
      logo: "logo.svg",
      features: content.features.map((_, i) => `feature-${i}.jpg`),
      fonts: [],
    },
  };
}
