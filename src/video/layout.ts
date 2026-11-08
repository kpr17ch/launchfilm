import { useVideoConfig } from "remotion";

export type Orientation = "landscape" | "portrait" | "square";

/**
 * One place for every size decision, so a single scene component works for 16:9, 9:16 and 1:1.
 * Sizes are expressed relative to the short edge of the frame.
 */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const orientation: Orientation = width > height ? "landscape" : height > width ? "portrait" : "square";
  const unit = Math.min(width, height) / 1080;
  return {
    width,
    height,
    orientation,
    unit,
    padding: 96 * unit,
    hookSize: (orientation === "landscape" ? 118 : 104) * unit,
    titleSize: (orientation === "landscape" ? 84 : 78) * unit,
    bodySize: (orientation === "landscape" ? 36 : 38) * unit,
    smallSize: 26 * unit,
    /** Width of the browser frame in the showcase scene. */
    frameWidth: orientation === "landscape" ? width * 0.74 : width * 0.86,
  };
}
