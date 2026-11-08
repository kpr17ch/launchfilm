# Architecture

launchfilm is a four-stage pipeline. Each stage writes a plain artifact to the job directory, so any stage can be re-run, inspected or replaced.

```
.launchfilm/<host>/
├── capture.json      raw facts + extracted brand and content + asset index
├── storyboard.json   scenes, copy, timing and theme (schema-validated)
├── assets/           hero.jpg, page.jpg, feature-N.jpg, logo.svg|png, fonts/*.woff2
└── out/              launchfilm-<format>.mp4
```

## 1. Capture: facts, not opinions

`src/capture/collect.ts` runs inside the page and returns a `RawPage` (`src/capture/types.ts`). It never decides what the brand color is; it records evidence:

- **Colors** as samples with a weight: background area (clipped to the first three viewports), text area (characters × font size²) and border length.
- **Buttons** with their computed fill and text color, size and position.
- **Headings** (h1–h3) with the first following paragraph, whether they sit in navigation or footer, and the largest *visual* in their section: an image, video, card or mockup that does not contain the heading.
- **Fonts** of the main heading and body text, **logo candidates** (inline SVG with computed fills inlined, or images) and **icons**.

Keeping the collector dumb is what makes the interesting logic testable: `tests/fixtures/raw.ts` builds a `RawPage` by hand and every extraction rule is exercised without a browser. The real browser path is covered separately by `tests/e2e`.

`capture.ts` adds the side effects: consent banners and chat bubbles are hidden with CSS, the page is scrolled to trigger lazy loading, screenshots are taken at 2× device scale, feature visuals are framed to 16:10 (`fitClip`), the logo is saved, and brand fonts are fetched from the Google Fonts CSS2 API (variable fonts collapse into a single face with a weight range).

## 2. Extract: brand and story

- `brand/color.ts`: parsing, HSL, WCAG luminance and contrast, alpha flattening, mixing.
- `brand/extract.ts`:
  - **background** = the largest-area cluster (near-identical shades are merged first);
  - **primary** = filled call-to-action buttons above the fold, then `theme-color`, then the most prominent saturated color;
  - **accent** = a second hue at least 35° away, or a derived analogous hue;
  - **foreground** = dominant text color with ≥ 7:1 contrast;
  - **muted** = a mix of foreground and background, so it inherits the page's tint;
  - **on-primary** prefers white on saturated mid-tones.
- `content/extract.ts`: tagline from the h1, description from the meta tag, features from h2/h3 in page order minus page furniture (pricing, FAQ, testimonials, "trusted by", nav, footer), CTA from hero buttons with action verbs.

## 3. Plan: words from a planner, structure from code

`storyboard/schema.ts` defines two contracts with zod:

- `Copy`, the only thing a planner produces: hook, tagline, showcase caption, up to three features (by index) with title and caption, CTA headline and button label. Each field documents its character limit.
- `Storyboard`, the complete film: theme, typed scenes (`hook`, `reveal`, `showcase`, `feature`, `cta`) with durations and asset references.

Planners:

- `heuristic.ts` derives copy from the page with clean sentence and clause boundaries; it never prints an ellipsis on screen and needs no network access.
- `claude.ts` sends a compact brief (product, domain, language, headline, description, CTA, features) and requests structured output validated against `CopySchema` (`client.messages.parse` + `zodOutputFormat`). Refusals, token limits and schema mismatches raise `ClaudePlannerError`.
- `plan.ts` chooses: `auto` falls back to the heuristic planner, `claude` surfaces errors.

`assemble.ts` sanitizes whatever copy it receives (hard limits, valid and unique feature references, at most three), computes pacing from reading time within fixed bounds, wires screenshots and logo, and validates the final storyboard.

## 4. Render

`render/render.ts` bundles `src/video/index.ts` once with the job's `assets/` as Remotion's public directory, then renders each requested composition (`launchfilm-landscape|portrait|square`). `calculateMetadata` derives the duration from the storyboard, so there is no separate timing configuration.

`src/video` uses one layout hook (`layout.ts`) for every size decision relative to the short edge of the frame. Scenes are composed from a small set of primitives: `Backdrop` (brand-colored, two slow light sources), `Words` (word-by-word reveal from a soft blur), `BrowserFrame`, `Shot` and `Logo` (with a monogram fallback). Brand fonts load through `@remotion/fonts` behind `delayRender`; Inter is the fallback.

## Design choices

- **Deterministic by default.** Same input, same film. The model is optional and confined to copy.
- **Artifacts over memory.** Every stage communicates through files a human can read and edit.
- **Restraint over effects.** One accent gradient, one light source per color, short springs, fades between scenes. Generic kinetic typography is what makes automated video look automated.
