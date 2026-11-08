/**
 * Small, dependency-free color toolkit used by brand extraction.
 * Everything works on 8-bit sRGB with an optional alpha channel.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Parses `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()` (comma or space syntax). Returns null for anything else. */
export function parseColor(input: string | null | undefined): Rgba | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (value === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (![3, 4, 6, 8].includes(hex.length) || /[^0-9a-f]/.test(hex)) return null;
    const expand = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
    const num = (i: number) => Number.parseInt(expand.slice(i, i + 2), 16);
    return { r: num(0), g: num(2), b: num(4), a: expand.length === 8 ? num(6) / 255 : 1 };
  }

  const match = value.match(/^rgba?\((.+)\)$/);
  if (!match?.[1]) return null;
  const parts = match[1]
    .replace(/\s*\/\s*/, " ")
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length < 3) return null;
  const channel = (raw: string) => (raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * 255 : Number.parseFloat(raw));
  const [r, g, b] = parts.slice(0, 3).map(channel) as [number, number, number];
  const alphaRaw = parts[3];
  const a =
    alphaRaw === undefined
      ? 1
      : alphaRaw.endsWith("%")
        ? Number.parseFloat(alphaRaw) / 100
        : Number.parseFloat(alphaRaw);
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a: clamp(a, 0, 1) };
}

export function toHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`;
}

export function toHsl({ r, g, b }: Rgba): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function fromHsl({ h, s, l }: Hsl, a = 1): Rgba {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255, a };
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two opaque colors, from 1 to 21. */
export function contrast(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Composites a translucent color over an opaque backdrop. */
export function flatten(color: Rgba, backdrop: Rgba): Rgba {
  const a = color.a;
  return {
    r: color.r * a + backdrop.r * (1 - a),
    g: color.g * a + backdrop.g * (1 - a),
    b: color.b * a + backdrop.b * (1 - a),
    a: 1,
  };
}

/** True for greys, near-black and near-white: colors that carry no brand hue. */
export function isNeutral(color: Rgba): boolean {
  const { s, l } = toHsl(color);
  return s < 0.18 || l < 0.08 || l > 0.95;
}

/** Shortest angular distance between two hues, in degrees (0-180). */
export function hueDistance(a: Rgba, b: Rgba): number {
  const diff = Math.abs(toHsl(a).h - toHsl(b).h) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Euclidean distance in RGB space; good enough to merge near-identical samples. */
export function rgbDistance(a: Rgba, b: Rgba): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

/** Linear blend in RGB space: t=0 returns a, t=1 returns b. */
export function mix(a: Rgba, b: Rgba, t: number): Rgba {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
}

/** Moves lightness toward the target while keeping hue and saturation. */
export function shiftLightness(color: Rgba, delta: number): Rgba {
  const hsl = toHsl(color);
  return fromHsl({ ...hsl, l: clamp(hsl.l + delta, 0, 1) }, color.a);
}

export const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
export const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/** Picks black or white text, whichever reads better on the given color. */
export function readableOn(color: Rgba): Rgba {
  return contrast(color, WHITE) >= contrast(color, BLACK) ? WHITE : BLACK;
}
