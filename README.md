# launchfilm

**Turn any product URL into a launch film.** launchfilm opens the site in a real browser, works out the brand (colors, fonts, logo), finds the story (headline, features, call to action), plans a storyboard and renders a polished 15–20 second video with [Remotion](https://www.remotion.dev): 16:9 for X and YouTube, 9:16 for TikTok and Reels, 1:1 for LinkedIn.

```bash
launchfilm make https://your-product.com --formats landscape,portrait
```

![launchfilm turning the Orbit example site into a launch film](docs/demo.gif)

<sub>Rendered from [`examples/orbit`](examples/orbit), a fictional product page bundled with the repo. Full-quality MP4: [`docs/demo-landscape.mp4`](docs/demo-landscape.mp4) · [`docs/demo-portrait.mp4`](docs/demo-portrait.mp4)</sub>

## Why

Every launch needs a video, and most teams ship without one: motion design takes days, and generic AI video looks generic. launchfilm starts from the one asset every product already has, its website, and keeps the film on-brand by construction. The colors, type, logo and screenshots come from the site itself; the motion is restrained on purpose.

## How it works

```
 URL ──► capture ──────────────► plan ─────────────────► render
         Playwright               copy: Claude or         Remotion
         brand + content          heuristic               one bundle,
         screenshots, logo,       structure + timing:     16:9 · 9:16 · 1:1
         Google Fonts             deterministic code
              │                        │                       │
         capture.json            storyboard.json          out/*.mp4
```

1. **Capture** (`src/capture`). A headless Chromium loads the page, hides cookie banners and chat widgets, scrolls to trigger lazy content and collects *raw facts* only: headings with their paragraphs, button fills, area-weighted color samples, font stacks, logo candidates and the illustration of each section. It takes a hero shot, a tall page shot and one shot per feature visual, saves the logo (inline SVG or image) and pulls brand fonts from Google Fonts when they exist there.
2. **Extract** (`src/brand`, `src/content`). Pure functions turn the raw facts into a palette (background, surface, foreground, muted, primary, accent, readable on-primary color), a brand name, a logo, a tagline, up to six product features and the main call to action. Navigation, pricing, testimonials and footer sections are filtered out.
3. **Plan** (`src/storyboard`). A planner writes the words: Claude via structured output when credentials are available, a deterministic heuristic otherwise or as a fallback. Code decides scene order, pacing (reading-time based, bounded to 15–22 s) and asset wiring. The result is a plain, schema-validated `storyboard.json` you can edit by hand.
4. **Render** (`src/render`, `src/video`). One Remotion bundle renders the storyboard in every format. Scenes are layout-aware (`useLayout`), so the same composition works for landscape, portrait and square.

The split between *facts*, *interpretation* and *rendering* is deliberate: everything except the browser step is unit-testable, and the model never controls structure or timing, only copy.

## Quick start

Requirements: Node.js 20+ on macOS, Linux or Windows (WSL2). Remotion brings its own ffmpeg.

```bash
git clone https://github.com/kpr17ch/launchfilm && cd launchfilm
npm install
npx playwright install chromium

# Try it on the bundled example
npm run example:serve &            # http://127.0.0.1:4173
npm run launchfilm -- make http://127.0.0.1:4173 --domain orbit.dev --draft
open .launchfilm/127.0.0.1/out/launchfilm-landscape.mp4
```

### Claude copywriting (optional)

```bash
export ANTHROPIC_API_KEY=...      # or: ant auth login
npm run launchfilm -- make https://your-product.com --planner claude
```

With `--planner auto` (the default) launchfilm uses Claude when credentials exist and falls back to the heuristic planner on any error or refusal, so you always get a film. Only extracted text facts are sent to the model: no HTML, no screenshots.

## CLI

| Command | What it does |
| --- | --- |
| `launchfilm make <url>` | capture → plan → render in one go |
| `launchfilm capture <url>` | write `capture.json` and `assets/` |
| `launchfilm plan <jobDir>` | write `storyboard.json` from a capture |
| `launchfilm render <jobDir>` | render `storyboard.json` |

| Option | Default | |
| --- | --- | --- |
| `-f, --formats` | `landscape` | any of `landscape,portrait,square` |
| `--planner` | `auto` | `auto`, `claude` or `heuristic` |
| `--model` | `claude-opus-5-5` | model for the Claude planner |
| `--domain` | from URL | domain shown in the film (useful for staging URLs) |
| `--draft` | off | render at half resolution |
| `--no-fonts` | | skip the Google Fonts lookup |
| `-o, --out` | `.launchfilm/<host>` | job directory |

### Edit, then render

The storyboard is the contract between planning and rendering. Change a line, swap a screenshot, reorder scenes, then render again without recapturing:

```bash
npm run launchfilm -- plan .launchfilm/your-product.com
$EDITOR .launchfilm/your-product.com/storyboard.json
npm run launchfilm -- render .launchfilm/your-product.com -f landscape,portrait,square
```

Preview and tweak scenes live in Remotion Studio with `npm run studio`.

## Development

```bash
npm run check      # typecheck + lint (Biome) + unit tests
npm run test:e2e   # real browser against examples/orbit
```

| Path | Responsibility |
| --- | --- |
| `src/capture/` | Playwright session, in-page collector, screenshots, logo and font download |
| `src/brand/` | color math (WCAG contrast, HSL, clustering) and palette/name/logo extraction |
| `src/content/` | tagline, features and call to action |
| `src/storyboard/` | schema (zod), heuristic and Claude planners, assembly and pacing |
| `src/video/` | Remotion compositions, scenes and layout system |
| `src/render/` | bundling and rendering |
| `examples/` | self-contained demo sites for tests and docs |

More detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Planned work is tracked in [issues](https://github.com/kpr17ch/launchfilm/issues) and summarised in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Responsible use

launchfilm reads public product pages. It does not log in, does not collect personal data and sends only extracted product copy to the model. Make films for products you own or have permission to promote, and respect the trademarks you capture.

## License

MIT © Kai Perich. launchfilm renders with [Remotion](https://www.remotion.dev), which is free for individuals and companies of up to three people and requires a [company license](https://www.remotion.pro/license) beyond that.
