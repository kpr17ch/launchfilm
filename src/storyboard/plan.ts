import type { CaptureResult } from "../capture/result.ts";
import { assembleStoryboard } from "./assemble.ts";
import { ClaudePlannerError, claudeCopy, type PlannerClient } from "./claude.ts";
import { heuristicCopy } from "./heuristic.ts";
import type { Storyboard } from "./schema.ts";

export type PlannerChoice = "auto" | "claude" | "heuristic";

export interface PlanOptions {
  planner?: PlannerChoice;
  model?: string;
  client?: PlannerClient;
  hasCredentials?: boolean;
  log?: (message: string) => void;
}

/**
 * `auto` uses Claude when credentials are available and silently degrades to the
 * heuristic planner otherwise, so the tool always produces a film.
 */
export async function planStoryboard(capture: CaptureResult, options: PlanOptions = {}): Promise<Storyboard> {
  const choice = options.planner ?? "auto";
  const log = options.log ?? (() => {});
  const hasCredentials =
    options.hasCredentials ?? Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

  if (choice === "heuristic" || (choice === "auto" && !hasCredentials && !options.client)) {
    if (choice === "auto") log("No Anthropic credentials found; using the heuristic planner.");
    return assembleStoryboard(capture, heuristicCopy(capture), "heuristic");
  }

  try {
    const copy = await claudeCopy(capture, { model: options.model, client: options.client });
    return assembleStoryboard(capture, copy, "claude");
  } catch (error) {
    if (choice === "claude") throw error;
    const reason = error instanceof ClaudePlannerError ? error.message : String(error);
    log(`Claude planner failed (${reason}); falling back to the heuristic planner.`);
    return assembleStoryboard(capture, heuristicCopy(capture), "heuristic");
  }
}
