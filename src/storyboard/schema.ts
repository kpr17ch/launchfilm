import { z } from "zod";

/**
 * The storyboard is the contract between planning and rendering. It is plain JSON:
 * planners write it, humans can edit it, and the Remotion composition only reads it.
 */

export const FPS = 30;
export const TRANSITION_FRAMES = 12;

export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;
export type FormatName = keyof typeof FORMATS;
export const FORMAT_NAMES = Object.keys(FORMATS) as FormatName[];

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "expected #rrggbb");
/** File name relative to the job's asset directory, or null when the asset is missing. */
const asset = z.string().min(1).nullable();

export const FontFileSchema = z.object({
  family: z.string(),
  file: z.string(),
  weight: z.string(),
  style: z.enum(["normal", "italic"]).default("normal"),
});

export const ThemeSchema = z.object({
  background: hex,
  surface: hex,
  foreground: hex,
  muted: hex,
  primary: hex,
  onPrimary: hex,
  accent: hex,
  dark: z.boolean(),
  fontHeading: z.string(),
  fontBody: z.string(),
  fontFiles: z.array(FontFileSchema).default([]),
});

const duration = z.number().int().min(15).max(300);

export const HookSceneSchema = z.object({
  type: z.literal("hook"),
  durationInFrames: duration,
  text: z.string().min(1),
});
export const RevealSceneSchema = z.object({
  type: z.literal("reveal"),
  durationInFrames: duration,
  name: z.string().min(1),
  tagline: z.string(),
  logo: asset,
});
export const ShowcaseSceneSchema = z.object({
  type: z.literal("showcase"),
  durationInFrames: duration,
  hero: asset,
  page: asset,
  /** Height / width of the full-page screenshot, used to scroll it inside the browser frame. */
  pageAspect: z.number().positive(),
  caption: z.string(),
  domain: z.string(),
});
export const FeatureSceneSchema = z.object({
  type: z.literal("feature"),
  durationInFrames: duration,
  index: z.number().int().min(0),
  total: z.number().int().min(1),
  title: z.string().min(1),
  caption: z.string().nullable(),
  screenshot: asset,
});
export const CtaSceneSchema = z.object({
  type: z.literal("cta"),
  durationInFrames: duration,
  headline: z.string().min(1),
  button: z.string().min(1),
  domain: z.string(),
  logo: asset,
  name: z.string(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  HookSceneSchema,
  RevealSceneSchema,
  ShowcaseSceneSchema,
  FeatureSceneSchema,
  CtaSceneSchema,
]);

export const StoryboardSchema = z.object({
  version: z.literal(1),
  fps: z.literal(FPS),
  transitionFrames: z.number().int().min(0).max(30),
  theme: ThemeSchema,
  scenes: z.array(SceneSchema).min(2),
  meta: z.object({
    source: z.string(),
    generatedAt: z.string(),
    planner: z.enum(["heuristic", "claude"]),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

/** Total frames once neighbouring scenes overlap by one transition each. */
export function totalFrames(storyboard: Pick<Storyboard, "scenes" | "transitionFrames">): number {
  const sum = storyboard.scenes.reduce((acc, scene) => acc + scene.durationInFrames, 0);
  return sum - storyboard.transitionFrames * Math.max(0, storyboard.scenes.length - 1);
}

/**
 * The words in the film. Planners (heuristic or Claude) only produce copy; scene
 * structure and timing are decided in code so every film stays well-paced.
 */
export const COPY_LIMITS = {
  hook: 44,
  tagline: 90,
  showcaseCaption: 60,
  featureTitle: 34,
  featureCaption: 72,
  ctaHeadline: 40,
  ctaButton: 22,
} as const;

export const CopySchema = z.object({
  hook: z.string().min(1).describe(`Scroll-stopping opening line, at most 7 words / ${COPY_LIMITS.hook} characters`),
  tagline: z
    .string()
    .min(1)
    .describe(`One-sentence positioning under the product name, max ${COPY_LIMITS.tagline} characters`),
  showcaseCaption: z
    .string()
    .min(1)
    .describe(`Caption over the product screenshot, max ${COPY_LIMITS.showcaseCaption} characters`),
  features: z
    .array(
      z.object({
        source: z.number().int().min(0).describe("Index of the feature in the provided list"),
        title: z.string().min(1).describe(`Benefit-led feature title, max ${COPY_LIMITS.featureTitle} characters`),
        caption: z.string().describe(`One supporting line, max ${COPY_LIMITS.featureCaption} characters`),
      }),
    )
    .max(3)
    .describe("The 1-3 most compelling features, in the order they should appear"),
  ctaHeadline: z.string().min(1).describe(`Closing headline, max ${COPY_LIMITS.ctaHeadline} characters`),
  ctaButton: z.string().min(1).describe(`Button label, 1-3 words, max ${COPY_LIMITS.ctaButton} characters`),
});
export type Copy = z.infer<typeof CopySchema>;
