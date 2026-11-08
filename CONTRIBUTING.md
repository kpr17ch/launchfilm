# Contributing

Thanks for helping. A few conventions keep the project easy to work on.

## Setup

```bash
npm install
npx playwright install chromium
npm run check        # typecheck, lint, unit tests
npm run test:e2e     # browser test against examples/orbit
```

## Ground rules

- **Keep the collector dumb.** `src/capture/collect.ts` records facts; interpretation belongs in `src/brand` or `src/content`, where it can be unit-tested with a hand-built `RawPage`.
- **The model writes words, code writes structure.** Planners return `Copy`; scene order, timing and asset wiring live in `src/storyboard/assemble.ts`.
- **Every size comes from `useLayout`.** No magic pixel values in scenes; scale with `layout.unit`.
- **Tests use synthetic pages.** Add new patterns under `examples/` rather than committing third-party HTML or screenshots.
- **No personal data, no credentials** in fixtures, logs or storyboards.

## Pull requests

Small and focused, with a test for every behavior change, and a before/after still for visual changes (`npx remotion still src/video/index.ts launchfilm-landscape out.png --frame=120`).
