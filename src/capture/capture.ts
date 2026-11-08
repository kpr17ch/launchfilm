import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type BrowserContext, chromium, type Page } from "playwright";
import { extractBrand } from "../brand/extract.ts";
import { extractContent } from "../content/extract.ts";
import { collectRawPage } from "./collect.ts";
import { downloadGoogleFont } from "./fonts.ts";
import type { CaptureResult } from "./result.ts";

export interface CaptureOptions {
  /** Job directory; assets go to `<outDir>/assets`, metadata to `<outDir>/capture.json`. */
  outDir: string;
  viewport?: { width: number; height: number };
  /** Skip Google Fonts lookups (useful offline and in tests). */
  fonts?: boolean;
  log?: (message: string) => void;
}

const VIEWPORT = { width: 1440, height: 900 };
const MAX_PAGE_HEIGHT_VIEWPORTS = 4;

/** Hides the usual consent banners and chat bubbles so they do not end up in the film. */
const OVERLAY_CSS = `
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
  [id*="onetrust" i], [class*="cmp-" i], [aria-label*="cookie" i], .cc-window,
  [id*="intercom" i], [class*="intercom" i], [id*="crisp" i], [id*="hubspot-messages" i]
  { display: none !important; }
  html { scroll-behavior: auto !important; }
`;

async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.addStyleTag({ content: OVERLAY_CSS }).catch(() => {});
  // Walk down a few screens so lazy-loaded sections and scroll-triggered animations render.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const stop = Math.min(height, VIEWPORT.height * MAX_PAGE_HEIGHT_VIEWPORTS);
  for (let y = 0; y < stop; y += VIEWPORT.height / 2) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

async function saveLogo(page: Page, capture: Pick<CaptureResult, "brand" | "raw">, assetsDir: string) {
  const logo = capture.brand.logo;
  if (logo?.kind === "svg" && logo.markup) {
    await writeFile(path.join(assetsDir, "logo.svg"), logo.markup, "utf8");
    return "logo.svg";
  }
  const icons = [...capture.raw.icons].sort((a, b) => {
    const size = (s: string | null) => Number.parseInt(s?.split("x")[0] ?? "0", 10) || 0;
    const appleBonus = (rel: string) => (rel.includes("apple") ? 1000 : 0);
    return size(b.sizes) + appleBonus(b.rel) - (size(a.sizes) + appleBonus(a.rel));
  });
  const sources = [logo?.src, ...icons.map((i) => i.href)].filter((s): s is string => Boolean(s));
  for (const src of sources) {
    try {
      const response = await page.request.get(src, { timeout: 10000 });
      if (!response.ok()) continue;
      const type = response.headers()["content-type"] ?? "";
      const ext = type.includes("svg")
        ? "svg"
        : type.includes("png")
          ? "png"
          : type.includes("webp")
            ? "webp"
            : type.includes("jpeg")
              ? "jpg"
              : null;
      if (!ext) continue;
      const file = `logo.${ext}`;
      await writeFile(path.join(assetsDir, file), await response.body());
      return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function screenshot(page: Page, file: string, clip: { x: number; y: number; width: number; height: number }) {
  await page.screenshot({ path: file, clip, fullPage: true, type: "jpeg", quality: 88, animations: "disabled" });
}

/**
 * Expands a visual's box to the 16:10 card the feature scene shows, with breathing room,
 * while staying inside the page.
 */
export function fitClip(
  box: { x: number; y: number; width: number; height: number },
  page: { width: number; height: number },
) {
  const pad = 40;
  let width = box.width + pad * 2;
  let height = box.height + pad * 2;
  if (width / height > 1.6) height = width / 1.6;
  else width = height * 1.6;
  width = Math.min(width, page.width);
  height = Math.min(height, page.height);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const x = Math.round(Math.min(Math.max(0, cx - width / 2), page.width - width));
  const y = Math.round(Math.min(Math.max(0, cy - height / 2), page.height - height));
  return { x, y, width: Math.round(width), height: Math.round(height) };
}

export async function capturePage(url: string, options: CaptureOptions): Promise<CaptureResult> {
  const log = options.log ?? (() => {});
  const viewport = options.viewport ?? VIEWPORT;
  const assetsDir = path.join(options.outDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const browser = await chromium.launch();
  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: "no-preference" });
    // tsx (esbuild) may wrap functions with a `__name` helper that does not exist in the page.
    await context.addInitScript("globalThis.__name = (fn) => fn;");
    const page = await context.newPage();
    log(`Opening ${url}`);
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
    await settle(page);

    const raw = await page.evaluate(collectRawPage);
    const brand = extractBrand(raw);
    const content = extractContent(raw);
    log(`Found "${brand.name}" with ${content.features.length} feature sections`);

    await screenshot(page, path.join(assetsDir, "hero.jpg"), { x: 0, y: 0, ...viewport });
    const pageHeight = Math.min(raw.documentHeight, viewport.height * MAX_PAGE_HEIGHT_VIEWPORTS);
    await screenshot(page, path.join(assetsDir, "page.jpg"), { x: 0, y: 0, width: viewport.width, height: pageHeight });

    const features: (string | null)[] = [];
    for (const [index, feature] of content.features.entries()) {
      const top = Math.max(0, Math.min(feature.y - 64, raw.documentHeight - viewport.height));
      const clip = feature.visual
        ? fitClip(feature.visual, { width: viewport.width, height: raw.documentHeight })
        : { x: 0, y: top, ...viewport };
      const file = `feature-${index}.jpg`;
      try {
        await screenshot(page, path.join(assetsDir, file), clip);
        features.push(file);
      } catch {
        features.push(null);
      }
    }

    const logo = await saveLogo(page, { brand, raw }, assetsDir);
    const fonts =
      options.fonts === false
        ? []
        : (
            await Promise.all(
              [...new Set([brand.fonts.heading, brand.fonts.body])].map((family) =>
                downloadGoogleFont(family, path.join(assetsDir, "fonts")).catch(() => []),
              ),
            )
          )
            .flat()
            .map((f) => ({ ...f, file: `fonts/${f.file}` }));
    if (fonts.length) log(`Loaded ${fonts.length} font files from Google Fonts`);

    const result: CaptureResult = {
      version: 1,
      capturedAt: new Date().toISOString(),
      raw,
      brand,
      content,
      assets: { hero: "hero.jpg", page: "page.jpg", logo, features, fonts },
    };
    await writeFile(path.join(options.outDir, "capture.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    return result;
  } finally {
    await context?.close();
    await browser.close();
  }
}
