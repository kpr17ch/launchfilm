import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";
import { BrowserFrame } from "../components/BrowserFrame.tsx";
import { Shot } from "../components/Shot.tsx";
import { Words } from "../components/Words.tsx";
import { useLayout } from "../layout.ts";

interface ShowcaseProps {
  hero: string | null;
  page: string | null;
  pageAspect: number;
  caption: string;
  domain: string;
  theme: Theme;
}

const VIEWPORT_ASPECT = 0.625;

/** The product in a browser window: tilts into place, then scrolls down the real page. */
export const ShowcaseScene: React.FC<ShowcaseProps> = ({ hero, page, pageAspect, caption, domain, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layout = useLayout();
  const enter = spring({ frame, fps, config: { damping: 200, mass: 1.1 } });
  const tilt = interpolate(enter, [0, 1], [24, 4]);
  const scale = interpolate(enter, [0, 1], [0.86, 1]);
  const lift = interpolate(enter, [0, 1], [180, 0]) * layout.unit;

  // Scroll through the page once the window has landed.
  const scrollable = Math.max(0, pageAspect - VIEWPORT_ASPECT) * layout.frameWidth;
  // A gentle drift, not a full scroll: the hero is usually the strongest frame of the page.
  const scroll = interpolate(frame, [34, durationInFrames], [0, Math.min(scrollable, layout.frameWidth * 0.32)], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const portrait = layout.orientation === "portrait";

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: portrait ? "center" : "flex-end",
        flexDirection: "column",
        gap: 56 * layout.unit,
        paddingTop: layout.padding * 0.8,
      }}
    >
      <div
        style={{
          color: theme.foreground,
          fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
          fontWeight: 650,
          fontSize: layout.titleSize * 0.82,
          letterSpacing: "-0.03em",
          textAlign: "center",
          padding: `0 ${layout.padding}px`,
        }}
      >
        <Words text={caption} delay={6} />
      </div>
      <div style={{ perspective: 2200 * layout.unit, marginBottom: portrait ? 0 : -layout.frameWidth * 0.12 }}>
        <BrowserFrame
          theme={theme}
          width={layout.frameWidth}
          domain={domain}
          unit={layout.unit}
          style={{
            transform: `translateY(${lift}px) rotateX(${tilt}deg) scale(${scale})`,
            transformOrigin: "50% 100%",
          }}
        >
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <Shot
              file={page ?? hero}
              theme={theme}
              style={page ? undefined : { height: layout.frameWidth * VIEWPORT_ASPECT }}
            />
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};
