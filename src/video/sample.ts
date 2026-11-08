import type { Storyboard } from "../storyboard/schema.ts";

/**
 * Storyboard used by Remotion Studio when no job is loaded. Assets are null on purpose:
 * every scene renders a brand-colored placeholder, so the studio works out of the box.
 */
export const sampleStoryboard: Storyboard = {
  version: 1,
  fps: 30,
  transitionFrames: 12,
  theme: {
    background: "#0b0d17",
    surface: "#161a2b",
    foreground: "#f4f5fb",
    muted: "#9aa0b8",
    primary: "#6d5efc",
    onPrimary: "#ffffff",
    accent: "#22c3ee",
    dark: true,
    fontHeading: "Inter",
    fontBody: "Inter",
    fontFiles: [],
  },
  scenes: [
    { type: "hook", durationInFrames: 72, text: "Release notes write themselves" },
    {
      type: "reveal",
      durationInFrames: 78,
      name: "Orbit",
      tagline: "Turns merged pull requests into changelogs your customers read",
      logo: null,
    },
    {
      type: "showcase",
      durationInFrames: 120,
      hero: null,
      page: null,
      pageAspect: 2.5,
      caption: "From merge to announcement",
      domain: "orbit.example",
    },
    {
      type: "feature",
      durationInFrames: 75,
      index: 0,
      total: 2,
      title: "Drafts from every merge",
      caption: "Orbit reads your pull requests and writes the first draft.",
      screenshot: null,
    },
    {
      type: "feature",
      durationInFrames: 75,
      index: 1,
      total: 2,
      title: "Publish everywhere",
      caption: "One click to your changelog, email and in-app widget.",
      screenshot: null,
    },
    {
      type: "cta",
      durationInFrames: 90,
      headline: "Ship the notes, not the busywork",
      button: "Start free",
      domain: "orbit.example",
      logo: null,
      name: "Orbit",
    },
  ],
  meta: { source: "https://orbit.example", generatedAt: "2026-11-08T00:00:00.000Z", planner: "heuristic" },
};
