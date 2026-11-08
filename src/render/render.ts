import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { type FormatName, type Storyboard, StoryboardSchema } from "../storyboard/schema.ts";

const ENTRY = fileURLToPath(new URL("../video/index.ts", import.meta.url));

export interface RenderOptions {
  /** Job directory: assets are served from `<jobDir>/assets`, films are written to `<jobDir>/out`. */
  jobDir: string;
  formats: FormatName[];
  log?: (message: string) => void;
  /** Lower values render faster; 1 is full quality. */
  scale?: number;
}

export interface RenderedFilm {
  format: FormatName;
  file: string;
}

/** Bundles the Remotion project once and renders the storyboard in every requested format. */
export async function renderFilms(storyboard: Storyboard, options: RenderOptions): Promise<RenderedFilm[]> {
  const log = options.log ?? (() => {});
  const valid = StoryboardSchema.parse(storyboard);
  const outDir = path.join(options.jobDir, "out");
  await mkdir(outDir, { recursive: true });

  log("Bundling the film");
  const serveUrl = await bundle({ entryPoint: ENTRY, publicDir: path.join(options.jobDir, "assets") });
  const inputProps = { storyboard: valid };

  const films: RenderedFilm[] = [];
  for (const format of options.formats) {
    const composition = await selectComposition({ serveUrl, id: `launchfilm-${format}`, inputProps });
    const file = path.join(outDir, `launchfilm-${format}.mp4`);
    let lastReported = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: file,
      inputProps,
      scale: options.scale ?? 1,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== lastReported) {
          lastReported = pct;
          log(`Rendering ${format}: ${pct}%`);
        }
      },
    });
    films.push({ format, file });
  }
  return films;
}
