# Roadmap

Each item is a GitHub issue with scope and acceptance criteria. Order within a milestone is rough priority.

## v0.2 Better films

- **Feature visuals that survive real sites**: crop to the actual element, handle tabs, carousels and sticky headers.
- **Portrait-first scene variants**: 9:16 deserves its own composition, not a reflowed 16:9.
- **Scene templates**: pluggable visual styles (`minimal`, `bold`, `editorial`) behind `--template`.
- **Interaction shots**: record a short scripted scroll/hover/click with Playwright and use it as a scene.
- **Music and sound design**: license-clean beds, cuts aligned to the beat grid.
- **Voiceover and captions**: optional TTS narration, burned-in captions and SRT export.
- **Closest-match fonts**: map proprietary brand fonts to the closest Google Font by metrics.
- **Light-theme polish**: shadows, glows and contrast tuned for light sites.
- **Logo cleanup**: transparent and monochrome variants for raster logos.

## v0.3 Smarter planning

- **Vision-aware planner (opt-in)**: let Claude see the captured screenshots to choose hero frames and features.
- **Multilingual copy**: follow the site language, with a `--lang` override.
- **Storyboard JSON Schema**: `launchfilm schema` for editor validation and autocompletion.
- **Copy-quality evals**: golden synthetic pages plus a rubric, tracked over time.
- **Style tokens from reference films**: describe pacing and motion as data, so no third-party footage ships with the repo.

## v0.4 Platform and developer experience

- **npm release with a compiled build**: no `tsx` at runtime.
- **Docker image**: Chromium, fonts and ffmpeg pinned for reproducible renders.
- **Remotion Lambda**: render all formats in parallel in the cloud.
- **Local web UI**: paste a URL, review the storyboard, tweak and render.
- **Batch mode**: many URLs from a CSV.
- **Authenticated app capture (opt-in)**: demo accounts only, with a redaction pass before anything is stored.

## Quality

- **Visual regression tests**: render stills of the sample storyboard with `renderStill` and diff them.
- **Synthetic fixture corpus**: example sites for common landing-page patterns (light theme, hero video, tabs, SPA).
- **CI**: cache Playwright browsers; macOS and Windows matrix.
