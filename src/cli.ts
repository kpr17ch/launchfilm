import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import { capturePage } from "./capture/capture.ts";
import type { CaptureResult } from "./capture/result.ts";
import { renderFilms } from "./render/render.ts";
import { DEFAULT_MODEL } from "./storyboard/claude.ts";
import { type PlannerChoice, planStoryboard } from "./storyboard/plan.ts";
import { FORMAT_NAMES, type FormatName, StoryboardSchema } from "./storyboard/schema.ts";

const log = (message: string) => console.error(`› ${message}`);

function parseFormats(value: string): FormatName[] {
  const formats = value.split(",").map((f) => f.trim()) as FormatName[];
  const unknown = formats.filter((f) => !FORMAT_NAMES.includes(f));
  if (unknown.length)
    throw new InvalidArgumentError(`Unknown format(s): ${unknown.join(", ")}. Use ${FORMAT_NAMES.join(", ")}.`);
  return formats;
}

function parseUrl(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).href;
  } catch {
    throw new InvalidArgumentError(`Not a valid URL: ${value}`);
  }
}

function defaultJobDir(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9.-]/gi, "-");
  return path.join(".launchfilm", host);
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

const plannerOption = new Option("--planner <planner>", "who writes the copy")
  .choices(["auto", "claude", "heuristic"])
  .default("auto");
const modelOption = new Option("--model <model>", "Claude model for the copy").default(DEFAULT_MODEL);
const formatsOption = new Option("-f, --formats <formats>", `comma-separated: ${FORMAT_NAMES.join(", ")}`)
  .argParser(parseFormats)
  .default(["landscape"] as FormatName[]);

const program = new Command()
  .name("launchfilm")
  .description("Turn a product URL into a launch film: capture → plan → render.")
  .version("0.1.0");

program
  .command("make")
  .description("capture, plan and render in one go")
  .argument("<url>", "product website", parseUrl)
  .option("-o, --out <dir>", "job directory (default: .launchfilm/<host>)")
  .addOption(formatsOption)
  .addOption(plannerOption)
  .addOption(modelOption)
  .option("--no-fonts", "skip Google Fonts lookup")
  .option("--domain <domain>", "domain shown in the film (e.g. when capturing a staging URL)")
  .option("--draft", "render at half resolution for a quick preview")
  .action(async (url: string, opts) => {
    const jobDir = opts.out ?? defaultJobDir(url);
    const capture = await capturePage(url, { outDir: jobDir, fonts: opts.fonts, log });
    if (opts.domain) capture.brand.domain = opts.domain;
    const storyboard = await planStoryboard(capture, {
      planner: opts.planner as PlannerChoice,
      model: opts.model,
      log,
    });
    await writeFile(path.join(jobDir, "storyboard.json"), `${JSON.stringify(storyboard, null, 2)}\n`);
    log(`Storyboard written by the ${storyboard.meta.planner} planner`);
    const films = await renderFilms(storyboard, { jobDir, formats: opts.formats, log, scale: opts.draft ? 0.5 : 1 });
    for (const film of films) console.log(film.file);
  });

program
  .command("capture")
  .description("open the site, extract brand and content, take screenshots")
  .argument("<url>", "product website", parseUrl)
  .option("-o, --out <dir>", "job directory (default: .launchfilm/<host>)")
  .option("--no-fonts", "skip Google Fonts lookup")
  .action(async (url: string, opts) => {
    const jobDir = opts.out ?? defaultJobDir(url);
    await capturePage(url, { outDir: jobDir, fonts: opts.fonts, log });
    console.log(path.join(jobDir, "capture.json"));
  });

program
  .command("plan")
  .description("write storyboard.json from an existing capture (edit it freely before rendering)")
  .argument("<jobDir>", "directory created by `capture`")
  .addOption(plannerOption)
  .addOption(modelOption)
  .option("--domain <domain>", "domain shown in the film")
  .action(async (jobDir: string, opts) => {
    const capture = await readJson<CaptureResult>(path.join(jobDir, "capture.json"));
    if (opts.domain) capture.brand.domain = opts.domain;
    const storyboard = await planStoryboard(capture, {
      planner: opts.planner as PlannerChoice,
      model: opts.model,
      log,
    });
    const file = path.join(jobDir, "storyboard.json");
    await writeFile(file, `${JSON.stringify(storyboard, null, 2)}\n`);
    console.log(file);
  });

program
  .command("render")
  .description("render storyboard.json into one or more formats")
  .argument("<jobDir>", "directory containing storyboard.json and assets/")
  .addOption(formatsOption)
  .option("--draft", "render at half resolution for a quick preview")
  .action(async (jobDir: string, opts) => {
    const storyboard = StoryboardSchema.parse(await readJson(path.join(jobDir, "storyboard.json")));
    const films = await renderFilms(storyboard, { jobDir, formats: opts.formats, log, scale: opts.draft ? 0.5 : 1 });
    for (const film of films) console.log(film.file);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(`✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
