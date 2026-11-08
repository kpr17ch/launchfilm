import type { Brand } from "../brand/extract.ts";
import type { Content } from "../content/extract.ts";
import type { RawPage } from "./types.ts";

/** Everything the capture step writes to `<job>/capture.json`. Asset paths are relative to `<job>/assets`. */
export interface CaptureResult {
  version: 1;
  capturedAt: string;
  raw: RawPage;
  brand: Brand;
  content: Content;
  assets: {
    hero: string | null;
    page: string | null;
    logo: string | null;
    features: (string | null)[];
    fonts: { family: string; file: string; weight: string; style: "normal" | "italic" }[];
  };
}
