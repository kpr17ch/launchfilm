import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";
import { Shot } from "../components/Shot.tsx";
import { Words } from "../components/Words.tsx";
import { useLayout } from "../layout.ts";

interface FeatureProps {
  index: number;
  total: number;
  title: string;
  caption: string | null;
  screenshot: string | null;
  theme: Theme;
}

/** One feature: a numbered title on one side, the matching section of the site on the other. */
export const FeatureScene: React.FC<FeatureProps> = ({ index, total, title, caption, screenshot, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layout = useLayout();
  const landscape = layout.orientation === "landscape";
  const cardIn = spring({ frame: frame - 4, fps, config: { damping: 200, mass: 0.9 } });
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.07]);
  const cardWidth = landscape ? layout.width * 0.5 : layout.width - layout.padding * 2;
  const border = theme.dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  return (
    <AbsoluteFill
      style={{
        flexDirection: landscape ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: (landscape ? 80 : 64) * layout.unit,
        padding: layout.padding,
      }}
    >
      <div style={{ flex: landscape ? "0 0 34%" : "0 0 auto", width: landscape ? undefined : "100%" }}>
        <div
          style={{
            color: theme.primary,
            fontFamily: `${theme.fontBody}, Inter, sans-serif`,
            fontSize: layout.smallSize,
            fontWeight: 600,
            letterSpacing: "0.12em",
            marginBottom: 20 * layout.unit,
            opacity: cardIn,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <div
          style={{
            color: theme.foreground,
            fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
            fontWeight: 650,
            fontSize: layout.titleSize,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            textWrap: "balance",
          }}
        >
          <Words text={title} delay={2} />
        </div>
        {caption ? (
          <div
            style={{
              marginTop: 24 * layout.unit,
              color: theme.muted,
              fontFamily: `${theme.fontBody}, Inter, sans-serif`,
              fontSize: layout.bodySize * 0.9,
              lineHeight: 1.35,
            }}
          >
            <Words text={caption} delay={12} stagger={1} />
          </div>
        ) : null}
      </div>
      <div style={{ perspective: 1800 * layout.unit }}>
        <div
          style={{
            width: cardWidth,
            height: cardWidth * 0.625,
            borderRadius: 18 * layout.unit,
            overflow: "hidden",
            border: `${Math.max(1, layout.unit)}px solid ${border}`,
            boxShadow: `0 ${30 * layout.unit}px ${90 * layout.unit}px rgba(0,0,0,${theme.dark ? 0.5 : 0.16})`,
            opacity: cardIn,
            transform: `translateX(${interpolate(cardIn, [0, 1], [landscape ? 140 : 0, 0]) * layout.unit}px) translateY(${interpolate(cardIn, [0, 1], [landscape ? 0 : 120, 0]) * layout.unit}px) rotateY(${interpolate(cardIn, [0, 1], [landscape ? -14 : 0, landscape ? -5 : 0])}deg)`,
          }}
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "30% 20%", height: "100%" }}>
            <Shot
              file={screenshot}
              theme={theme}
              style={{ height: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
