import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";

/** Brand-colored background with two slow, soft light sources. Quiet on purpose. */
export const Backdrop: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const drift = (speed: number, range: number) => Math.sin(frame / speed) * range;
  const strength = theme.dark ? "40" : "26";
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${28 + drift(70, 6)}% ${18 + drift(90, 5)}%, ${theme.primary}${strength} 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 50% at ${78 + drift(80, 5)}% ${86 + drift(60, 4)}%, ${theme.accent}${strength} 0%, transparent 72%)`,
        }}
      />
    </AbsoluteFill>
  );
};
