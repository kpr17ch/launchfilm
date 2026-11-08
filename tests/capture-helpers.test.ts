import { describe, expect, it } from "vitest";
import { fitClip } from "../src/capture/capture.ts";
import { groupByUrl, parseGoogleFontsCss } from "../src/capture/fonts.ts";

const CSS = `/* cyrillic */
@font-face { font-family: 'Manrope'; font-style: normal; font-weight: 400 800; src: url(https://fonts.gstatic.com/cyr.woff2) format('woff2'); }
/* latin-ext */
@font-face { font-family: 'Manrope'; font-style: normal; font-weight: 400 800; src: url(https://fonts.gstatic.com/ext.woff2) format('woff2'); }
/* latin */
@font-face { font-family: 'Manrope'; font-style: normal; font-weight: 400; src: url(https://fonts.gstatic.com/latin.woff2) format('woff2'); }
/* latin */
@font-face { font-family: 'Manrope'; font-style: normal; font-weight: 700; src: url(https://fonts.gstatic.com/latin.woff2) format('woff2'); }`;

describe("Google Fonts CSS", () => {
  it("keeps only latin faces", () => {
    const faces = parseGoogleFontsCss(CSS);
    expect(faces.map((f) => f.url)).toEqual([
      "https://fonts.gstatic.com/latin.woff2",
      "https://fonts.gstatic.com/latin.woff2",
    ]);
  });

  it("collapses a variable font into one face with a weight range", () => {
    expect(groupByUrl(parseGoogleFontsCss(CSS))).toEqual([
      { url: "https://fonts.gstatic.com/latin.woff2", style: "normal", weight: "400 700" },
    ]);
  });
});

describe("fitClip", () => {
  const page = { width: 1440, height: 4000 };

  it("pads a visual into a 16:10 frame centred on it", () => {
    const clip = fitClip({ x: 700, y: 1000, width: 480, height: 320 }, page);
    expect(clip.width / clip.height).toBeCloseTo(1.6, 1);
    expect(clip.x).toBeLessThanOrEqual(700);
    expect(clip.x + clip.width).toBeGreaterThanOrEqual(1180);
  });

  it("stays inside the page", () => {
    const clip = fitClip({ x: 1300, y: 3900, width: 300, height: 200 }, page);
    expect(clip.x + clip.width).toBeLessThanOrEqual(page.width);
    expect(clip.y + clip.height).toBeLessThanOrEqual(page.height);
  });
});
