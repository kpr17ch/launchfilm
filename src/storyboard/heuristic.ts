import type { CaptureResult } from "../capture/result.ts";
import { COPY_LIMITS, type Copy } from "./schema.ts";
import { cleanClause, limitWords, truncateWords, wordCount } from "./text.ts";

/**
 * Deterministic copywriter: no network, no API key, always produces a valid film.
 * Used as the default and as the fallback when the Claude planner is unavailable.
 */
export function heuristicCopy(capture: CaptureResult): Copy {
  const { brand, content } = capture;

  // A long hero headline becomes a hook by keeping its first clause.
  const taglineClause = content.tagline.split(/[.!?—–:|]/)[0]?.trim() || content.tagline;
  const hook =
    wordCount(taglineClause) <= 7
      ? truncateWords(taglineClause, COPY_LIMITS.hook)
      : limitWords(taglineClause, 6, COPY_LIMITS.hook);

  const tagline =
    cleanClause(content.description, COPY_LIMITS.tagline) ?? truncateWords(content.tagline, COPY_LIMITS.tagline);

  const features = content.features.slice(0, 3).map((feature, source) => ({
    source,
    title: truncateWords(feature.title, COPY_LIMITS.featureTitle),
    caption: cleanClause(feature.body, COPY_LIMITS.featureCaption) ?? "",
  }));

  return {
    hook,
    tagline,
    showcaseCaption: truncateWords(`Meet ${brand.name}`, COPY_LIMITS.showcaseCaption),
    features,
    ctaHeadline: truncateWords(`Try ${brand.name} today`, COPY_LIMITS.ctaHeadline),
    ctaButton: truncateWords(content.cta.label, COPY_LIMITS.ctaButton),
  };
}
