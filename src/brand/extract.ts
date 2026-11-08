import type { RawLogoCandidate, RawPage } from "../capture/types.ts";
import {
  BLACK,
  contrast,
  flatten,
  fromHsl,
  hueDistance,
  isNeutral,
  luminance,
  mix,
  parseColor,
  type Rgba,
  readableOn,
  rgbDistance,
  shiftLightness,
  toHex,
  toHsl,
  WHITE,
} from "./color.ts";

export interface BrandPalette {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  primary: string;
  onPrimary: string;
  accent: string;
}

export interface Brand {
  name: string;
  domain: string;
  palette: BrandPalette;
  /** True when the site uses a dark background; scenes mirror that. */
  dark: boolean;
  fonts: { heading: string; body: string };
  logo: RawLogoCandidate | null;
}

const FALLBACK_PRIMARY: Rgba = { r: 91, g: 91, b: 214, a: 1 };

interface WeightedColor {
  color: Rgba;
  weight: number;
}

/** Merges near-identical colors so one brand blue is not split into five shades. */
export function clusterColors(samples: WeightedColor[], threshold = 28): WeightedColor[] {
  const clusters: WeightedColor[] = [];
  for (const sample of samples) {
    const existing = clusters.find((c) => rgbDistance(c.color, sample.color) < threshold);
    if (existing) existing.weight += sample.weight;
    else clusters.push({ color: { ...sample.color }, weight: sample.weight });
  }
  return clusters.sort((a, b) => b.weight - a.weight);
}

function pickBackground(raw: RawPage): Rgba {
  const pageBg = parseColor(raw.pageBackground);
  const base = pageBg && pageBg.a > 0.5 ? flatten(pageBg, WHITE) : WHITE;
  const backgrounds = raw.colors
    .filter((s) => s.kind === "background")
    .map((s) => ({ color: parseColor(s.color), weight: s.area }))
    .filter((s): s is WeightedColor => s.color !== null && s.color.a > 0.6)
    .map((s) => ({ color: flatten(s.color, base), weight: s.weight }));
  const top = clusterColors([{ color: base, weight: raw.viewport.width * raw.viewport.height }, ...backgrounds])[0];
  return top?.color ?? base;
}

function pickPrimary(raw: RawPage, background: Rgba): Rgba {
  // 1. Filled call-to-action buttons near the top of the page.
  const buttonFills = raw.buttons
    .map((b) => ({
      color: parseColor(b.background),
      weight: b.width * b.height * (b.y < raw.viewport.height * 1.5 ? 3 : 1),
    }))
    .filter((s): s is WeightedColor => s.color !== null && s.color.a > 0.6)
    .map((s) => ({ color: flatten(s.color, background), weight: s.weight }))
    .filter((s) => !isNeutral(s.color) && rgbDistance(s.color, background) > 40);
  const fromButtons = clusterColors(buttonFills)[0];
  if (fromButtons) return fromButtons.color;

  // 2. The declared theme color.
  const theme = parseColor(raw.meta.themeColor);
  if (theme && !isNeutral(theme)) return { ...theme, a: 1 };

  // 3. The most prominent saturated color anywhere on the page.
  const saturated = raw.colors
    .map((s) => ({ color: parseColor(s.color), weight: s.kind === "background" ? s.area : s.area * 2 }))
    .filter((s): s is WeightedColor => s.color !== null && s.color.a > 0.6)
    .map((s) => ({ color: flatten(s.color, background), weight: s.weight }))
    .filter((s) => !isNeutral(s.color));
  return clusterColors(saturated)[0]?.color ?? FALLBACK_PRIMARY;
}

function pickAccent(raw: RawPage, primary: Rgba, background: Rgba): Rgba {
  const candidates = raw.colors
    .map((s) => ({ color: parseColor(s.color), weight: s.area }))
    .filter((s): s is WeightedColor => s.color !== null && s.color.a > 0.6)
    .map((s) => ({ color: flatten(s.color, background), weight: s.weight }))
    .filter((s) => !isNeutral(s.color) && hueDistance(s.color, primary) > 35);
  const found = clusterColors(candidates)[0];
  if (found) return found.color;
  // No second brand hue: derive an analogous one so gradients still have depth.
  const hsl = toHsl(primary);
  return fromHsl({ h: hsl.h + 40, s: Math.min(1, hsl.s + 0.05), l: Math.min(0.7, Math.max(0.45, hsl.l)) });
}

function pickForeground(raw: RawPage, background: Rgba): Rgba {
  const texts = raw.colors
    .filter((s) => s.kind === "text")
    .map((s) => ({ color: parseColor(s.color), weight: s.area }))
    .filter((s): s is WeightedColor => s.color !== null && s.color.a > 0.5)
    .map((s) => ({ color: flatten(s.color, background), weight: s.weight }))
    .filter((s) => contrast(s.color, background) >= 7);
  return clusterColors(texts)[0]?.color ?? readableOn(background);
}

/** First concrete family from a CSS font stack, without quotes or generic fallbacks. */
export function primaryFamily(stack: string | undefined): string | null {
  if (!stack) return null;
  const generic = new Set([
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "-apple-system",
    "blinkmacsystemfont",
    "inherit",
  ]);
  for (const part of stack.split(",")) {
    const family = part.trim().replace(/^["']|["']$/g, "");
    if (family && !generic.has(family.toLowerCase())) return family;
  }
  return null;
}

/** Brand name: og:site_name, then the shortest meaningful title segment, then the domain. */
export function extractName(raw: RawPage): string {
  if (raw.meta.ogSiteName) return raw.meta.ogSiteName;
  const segments = raw.title
    .split(/\s+[|–—·:-]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const domainWord = domainOf(raw.url).split(".")[0] ?? "";
  const matching = segments.find((s) => s.toLowerCase().replace(/\s+/g, "") === domainWord.toLowerCase());
  if (matching) return matching;
  const short = segments.filter((s) => s.split(" ").length <= 3).sort((a, b) => a.length - b.length)[0];
  if (short) return short;
  return domainWord ? domainWord[0]?.toUpperCase() + domainWord.slice(1) : raw.title;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Prefers an inline SVG or image in the header, top-left, that mentions the brand. */
export function pickLogo(raw: RawPage, name: string): RawLogoCandidate | null {
  const lowerName = name.toLowerCase();
  const scored = raw.logos.map((logo) => {
    let score = 0;
    if (logo.inHeader) score += 3;
    if (logo.x < raw.viewport.width * 0.33) score += 2;
    if (logo.y < 120) score += 2;
    const label = `${logo.alt} ${logo.src ?? ""}`.toLowerCase();
    if (label.includes("logo")) score += 3;
    if (lowerName && label.includes(lowerName)) score += 3;
    if (logo.width / logo.height > 6) score -= 1;
    if (logo.width < 20 && logo.height < 20) score -= 2;
    return { logo, score };
  });
  return scored.sort((a, b) => b.score - a.score).find((s) => s.score >= 4)?.logo ?? null;
}

export function extractBrand(raw: RawPage): Brand {
  const background = pickBackground(raw);
  const dark = luminance(background) < 0.2;
  const primary = pickPrimary(raw, background);
  const accent = pickAccent(raw, primary, background);
  const foreground = pickForeground(raw, background);
  const surface = shiftLightness(background, dark ? 0.06 : -0.035);
  // Secondary text sits between foreground and background, so it inherits the page's own tint.
  const muted = mix(foreground, background, 0.42);
  const name = extractName(raw);
  const heading = primaryFamily(raw.fonts.find((f) => f.role === "heading")?.family) ?? "Inter";
  const body = primaryFamily(raw.fonts.find((f) => f.role === "body")?.family) ?? heading;

  return {
    name,
    domain: domainOf(raw.url),
    palette: {
      background: toHex(background),
      surface: toHex(surface),
      foreground: toHex(foreground),
      muted: toHex(muted),
      primary: toHex(primary),
      // Saturated mid-tones read better with white labels even when black scores slightly higher.
      onPrimary: toHex(contrast(primary, WHITE) >= 3.2 ? WHITE : readableOn(primary) === WHITE ? WHITE : BLACK),
      accent: toHex(accent),
    },
    dark,
    fonts: { heading, body },
    logo: pickLogo(raw, name),
  };
}
