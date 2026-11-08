import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface FontFile {
  family: string;
  file: string;
  weight: string;
  style: "normal" | "italic";
}

/** Browsers only get woff2 from the Google Fonts CSS API when they look like a modern browser. */
const MODERN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export interface FontFace {
  weight: string;
  style: "normal" | "italic";
  url: string;
}

/** Parses the latin @font-face blocks of a Google Fonts CSS2 response. */
export function parseGoogleFontsCss(css: string): FontFace[] {
  const faces: FontFace[] = [];
  const blocks = css.split(/(?=\/\*\s*[\w-]+\s*\*\/)/);
  for (const block of blocks) {
    const subset = block.match(/\/\*\s*([\w-]+)\s*\*\//)?.[1];
    if (subset && subset !== "latin") continue;
    const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
    const weight = block.match(/font-weight:\s*([\d\s]+);/)?.[1]?.trim();
    const style = block.match(/font-style:\s*(\w+);/)?.[1] === "italic" ? "italic" : "normal";
    if (url && weight) faces.push({ url, weight, style });
  }
  return faces;
}

/**
 * Variable fonts come back as the same file for every requested weight. Collapse those into one
 * face with a weight range ("400 800"), which is also what the CSS font-weight descriptor expects.
 */
export function groupByUrl(faces: FontFace[]): FontFace[] {
  const groups = new Map<string, { url: string; style: FontFace["style"]; weights: number[] }>();
  for (const face of faces) {
    const key = `${face.url}|${face.style}`;
    const group = groups.get(key) ?? { url: face.url, style: face.style, weights: [] };
    group.weights.push(
      ...face.weight
        .split(/\s+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n)),
    );
    groups.set(key, group);
  }
  return [...groups.values()].map((g) => {
    const min = Math.min(...g.weights);
    const max = Math.max(...g.weights);
    return { url: g.url, style: g.style, weight: min === max ? String(min) : `${min} ${max}` };
  });
}

/**
 * Downloads the latin woff2 files for a Google Font, if the family exists there.
 * Returns an empty list for system or proprietary fonts; the film then falls back to Inter.
 */
export async function downloadGoogleFont(family: string, dir: string): Promise<FontFile[]> {
  const query = encodeURIComponent(family).replace(/%20/g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${query}:wght@400;500;600;700;800&display=swap`;
  const response = await fetch(url, { headers: { "user-agent": MODERN_UA } });
  if (!response.ok) return [];
  const faces = parseGoogleFontsCss(await response.text());
  if (faces.length === 0) return [];

  await mkdir(dir, { recursive: true });
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const files: FontFile[] = [];
  for (const group of groupByUrl(faces)) {
    const fontResponse = await fetch(group.url);
    if (!fontResponse.ok) continue;
    const file = `${slug}-${group.weight.replace(/\s+/g, "-")}-${group.style}.woff2`;
    await writeFile(path.join(dir, file), Buffer.from(await fontResponse.arrayBuffer()));
    files.push({ family, file, weight: group.weight, style: group.style });
  }
  return files;
}
