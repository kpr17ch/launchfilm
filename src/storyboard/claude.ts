import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { CaptureResult } from "../capture/result.ts";
import { COPY_LIMITS, type Copy, CopySchema } from "./schema.ts";

export const DEFAULT_MODEL = "claude-opus-5-5";

const SYSTEM_PROMPT = `You are the copywriter for a 15-second product launch film.
You receive facts extracted from the product's own website. Write on-screen copy that a
viewer reads in under two seconds per line: concrete, benefit-led, no buzzwords, no emoji,
no exclamation marks, no claims that are not supported by the provided facts.
Match the language of the website. Keep the brand's own product name exactly as given.
Character limits are hard limits: ${JSON.stringify(COPY_LIMITS)}.`;

export interface PlannerClient {
  messages: Pick<Anthropic["messages"], "parse">;
}

export class ClaudePlannerError extends Error {}

/** The facts the copywriter sees. Kept small and explicit: no raw HTML, no screenshots. */
export function buildBrief(capture: CaptureResult) {
  return {
    product: capture.brand.name,
    domain: capture.brand.domain,
    language: capture.raw.lang,
    headline: capture.content.tagline,
    description: capture.content.description,
    callToAction: capture.content.cta.label,
    features: capture.content.features.map((f, index) => ({ index, title: f.title, detail: f.body })),
  };
}

/**
 * Asks Claude for the film's copy as structured output. Scene structure and timing stay in
 * code (see assemble.ts); the model only writes words and picks which features to show.
 */
export async function claudeCopy(
  capture: CaptureResult,
  options: { model?: string; client?: PlannerClient } = {},
): Promise<Copy> {
  const client = options.client ?? new Anthropic();
  const response = await client.messages.parse({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(CopySchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write the copy for this product's launch film.\n\n${JSON.stringify(buildBrief(capture), null, 2)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new ClaudePlannerError("Claude declined to write copy for this page");
  if (response.stop_reason === "max_tokens") throw new ClaudePlannerError("Claude ran out of output tokens");
  if (!response.parsed_output) throw new ClaudePlannerError("Claude returned copy that did not match the schema");
  return response.parsed_output;
}
