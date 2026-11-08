import type { CaptureResult } from "../capture/result.ts";
import {
  COPY_LIMITS,
  type Copy,
  FPS,
  type Scene,
  type Storyboard,
  StoryboardSchema,
  TRANSITION_FRAMES,
} from "./schema.ts";
import { truncateWords, wordCount } from "./text.ts";

/** Enforces hard limits and valid feature references, whatever the planner returned. */
export function sanitizeCopy(copy: Copy, featureCount: number): Copy {
  const used = new Set<number>();
  const features: Copy["features"] = [];
  for (const f of copy.features) {
    if (!Number.isInteger(f.source) || f.source < 0 || f.source >= featureCount || used.has(f.source)) continue;
    used.add(f.source);
    features.push({
      source: f.source,
      title: truncateWords(f.title, COPY_LIMITS.featureTitle),
      caption: truncateWords(f.caption, COPY_LIMITS.featureCaption),
    });
    if (features.length === 3) break;
  }
  return {
    hook: truncateWords(copy.hook, COPY_LIMITS.hook),
    tagline: truncateWords(copy.tagline, COPY_LIMITS.tagline),
    showcaseCaption: truncateWords(copy.showcaseCaption, COPY_LIMITS.showcaseCaption),
    features,
    ctaHeadline: truncateWords(copy.ctaHeadline, COPY_LIMITS.ctaHeadline),
    ctaButton: truncateWords(copy.ctaButton, COPY_LIMITS.ctaButton),
  };
}

/**
 * Reading time drives pacing (about 0.22 s per word on top of a short settle time), bounded so
 * a wordy page cannot stretch the film: the whole thing should land between 15 and 22 seconds.
 */
const readFrames = (text: string, minimum: number, maximum: number) =>
  Math.round(Math.min(maximum, Math.max(minimum, (0.8 + wordCount(text) * 0.22) * FPS)));

export function assembleStoryboard(
  capture: CaptureResult,
  rawCopy: Copy,
  planner: Storyboard["meta"]["planner"],
  now: Date = new Date(),
): Storyboard {
  const copy = sanitizeCopy(rawCopy, capture.content.features.length);
  const { brand, assets } = capture;

  const scenes: Scene[] = [
    { type: "hook", durationInFrames: readFrames(copy.hook, 60, 84), text: copy.hook },
    {
      type: "reveal",
      durationInFrames: readFrames(copy.tagline, 66, 96),
      name: brand.name,
      tagline: copy.tagline,
      logo: assets.logo,
    },
    {
      type: "showcase",
      durationInFrames: 108,
      hero: assets.hero,
      page: assets.page,
      pageAspect:
        Math.min(capture.raw.documentHeight, capture.raw.viewport.height * 4) / Math.max(1, capture.raw.viewport.width),
      caption: copy.showcaseCaption,
      domain: brand.domain,
    },
    ...copy.features.map(
      (feature, index): Scene => ({
        type: "feature",
        durationInFrames: readFrames(`${feature.title} ${feature.caption}`, 60, 84),
        index,
        total: copy.features.length,
        title: feature.title,
        caption: feature.caption || null,
        screenshot: assets.features[feature.source] ?? null,
      }),
    ),
    {
      type: "cta",
      durationInFrames: 84,
      headline: copy.ctaHeadline,
      button: copy.ctaButton,
      domain: brand.domain,
      logo: assets.logo,
      name: brand.name,
    },
  ];

  return StoryboardSchema.parse({
    version: 1,
    fps: FPS,
    transitionFrames: TRANSITION_FRAMES,
    theme: {
      ...brand.palette,
      dark: brand.dark,
      fontHeading: brand.fonts.heading,
      fontBody: brand.fonts.body,
      fontFiles: assets.fonts,
    },
    scenes,
    meta: { source: capture.raw.url, generatedAt: now.toISOString(), planner },
  });
}
