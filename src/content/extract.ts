import type { RawBox, RawHeading, RawPage } from "../capture/types.ts";

export interface Feature {
  title: string;
  body: string | null;
  /** Document-space offset of the heading, used to screenshot the matching section. */
  y: number;
  /** The section's illustration, preferred over a plain section screenshot. */
  visual: RawBox | null;
}

export interface Content {
  tagline: string;
  description: string | null;
  features: Feature[];
  cta: { label: string; href: string | null };
}

/** Section titles that describe page furniture rather than the product. */
const GENERIC_HEADINGS = [
  /^pricing$/i,
  /^plans?( & pricing)?$/i,
  /^faqs?$/i,
  /frequently asked/i,
  /^testimonials?$/i,
  /what (our )?(customers|people|users) (say|are saying)/i,
  /^(trusted|loved|used) by/i,
  /^(contact|contact us|get in touch)$/i,
  /^(blog|news|press|careers|about|about us|team|resources|company|legal)$/i,
  /^(sign up|log ?in|get started|start (for )?free)$/i,
  /newsletter|subscribe/i,
  /cookie/i,
];

const CTA_PATTERN =
  /\b(get started|start|try|sign up|join|book|request|download|install|get|create|launch|build|request a demo|see it)\b/i;
const NON_CTA_PATTERN = /\b(log ?in|sign ?in|menu|close|accept|cookies?|pricing|docs|blog|contact)\b/i;

export const clean = (text: string) => text.replace(/\s+/g, " ").trim();

function isUsefulFeature(heading: RawHeading): boolean {
  if (heading.level === 1 || heading.inNav || heading.inFooter) return false;
  const text = clean(heading.text);
  if (text.length < 3 || text.length > 70) return false;
  if (text.split(" ").length > 10) return false;
  return !GENERIC_HEADINGS.some((pattern) => pattern.test(text));
}

export function extractTagline(raw: RawPage): string {
  const h1 = raw.headings.find((h) => h.level === 1 && !h.inNav && !h.inFooter);
  return clean(h1?.text ?? raw.meta.ogTitle ?? raw.title);
}

export function extractFeatures(raw: RawPage, limit = 6): Feature[] {
  const seen = new Set<string>();
  const features: Feature[] = [];
  for (const heading of [...raw.headings].sort((a, b) => a.y - b.y)) {
    if (!isUsefulFeature(heading)) continue;
    const key = clean(heading.text).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    features.push({
      title: clean(heading.text),
      body: heading.body ? clean(heading.body) : null,
      y: heading.y,
      visual: heading.visual ?? null,
    });
    if (features.length >= limit) break;
  }
  return features;
}

export function extractCta(raw: RawPage): Content["cta"] {
  const fold = raw.viewport.height * 1.2;
  const candidates = raw.buttons.filter((b) => !NON_CTA_PATTERN.test(b.text) && b.text.length <= 28);
  const best =
    candidates.find((b) => b.y < fold && CTA_PATTERN.test(b.text)) ??
    candidates.find((b) => CTA_PATTERN.test(b.text)) ??
    candidates.find((b) => b.y < fold);
  return { label: best ? clean(best.text) : "Get started", href: best?.href ?? null };
}

export function extractContent(raw: RawPage): Content {
  const tagline = extractTagline(raw);
  const h1 = raw.headings.find((h) => h.level === 1);
  return {
    tagline,
    description: raw.meta.description ? clean(raw.meta.description) : h1?.body ? clean(h1.body) : null,
    features: extractFeatures(raw),
    cta: extractCta(raw),
  };
}
