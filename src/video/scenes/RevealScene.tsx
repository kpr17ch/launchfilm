import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";
import { Logo } from "../components/Logo.tsx";
import { Words } from "../components/Words.tsx";
import { useLayout } from "../layout.ts";

interface RevealProps {
  name: string;
  tagline: string;
  logo: string | null;
  theme: Theme;
}

export const RevealScene: React.FC<RevealProps> = ({ name, tagline, logo, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const pop = spring({ frame: frame - 2, fps, config: { damping: 16, mass: 0.7 } });
  const nameIn = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const logoSize = 132 * layout.unit;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: layout.padding,
        gap: 44 * layout.unit,
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32 * layout.unit,
          flexDirection: layout.orientation === "portrait" ? "column" : "row",
        }}
      >
        <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`, opacity: pop }}>
          <Logo file={logo} name={name} size={logoSize} theme={theme} />
        </div>
        <div
          style={{
            color: theme.foreground,
            fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
            fontWeight: 700,
            fontSize: layout.titleSize * 1.35,
            letterSpacing: "-0.04em",
            opacity: nameIn,
            transform: `translateX(${interpolate(nameIn, [0, 1], [-24, 0]) * layout.unit}px)`,
          }}
        >
          {name}
        </div>
      </div>
      <div
        style={{
          maxWidth: layout.width * 0.7,
          textAlign: "center",
          color: theme.muted,
          fontFamily: `${theme.fontBody}, Inter, sans-serif`,
          fontSize: layout.bodySize,
          lineHeight: 1.3,
          textWrap: "balance",
        }}
      >
        <Words text={tagline} delay={18} stagger={2} />
      </div>
    </AbsoluteFill>
  );
};
