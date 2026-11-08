import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";
import { Logo } from "../components/Logo.tsx";
import { Words } from "../components/Words.tsx";
import { useLayout } from "../layout.ts";

interface CtaProps {
  headline: string;
  button: string;
  domain: string;
  logo: string | null;
  name: string;
  theme: Theme;
}

export const CtaScene: React.FC<CtaProps> = ({ headline, button, domain, logo, name, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const buttonIn = spring({ frame: frame - 16, fps, config: { damping: 14, mass: 0.6 } });
  const glow = 0.35 + 0.15 * Math.sin(frame / 8);
  const meta = spring({ frame: frame - 26, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48 * layout.unit,
        padding: layout.padding,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18 * layout.unit,
          opacity: spring({ frame, fps, config: { damping: 200 } }),
        }}
      >
        <Logo file={logo} name={name} size={64 * layout.unit} theme={theme} />
        <span
          style={{
            color: theme.foreground,
            fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
            fontWeight: 700,
            fontSize: 44 * layout.unit,
            letterSpacing: "-0.03em",
          }}
        >
          {name}
        </span>
      </div>
      <div
        style={{
          color: theme.foreground,
          fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
          fontWeight: 650,
          fontSize: layout.titleSize * 1.05,
          letterSpacing: "-0.035em",
          lineHeight: 1.05,
          textAlign: "center",
          textWrap: "balance",
          maxWidth: layout.width * 0.8,
        }}
      >
        <Words text={headline} delay={6} />
      </div>
      <div
        style={{
          transform: `scale(${interpolate(buttonIn, [0, 1], [0.7, 1])})`,
          opacity: buttonIn,
          padding: `${22 * layout.unit}px ${52 * layout.unit}px`,
          borderRadius: 999,
          backgroundColor: theme.primary,
          color: theme.onPrimary,
          fontFamily: `${theme.fontBody}, Inter, sans-serif`,
          fontWeight: 600,
          fontSize: layout.bodySize,
          boxShadow: `0 0 ${60 * layout.unit}px ${theme.primary}${Math.round(glow * 255)
            .toString(16)
            .padStart(2, "0")}`,
        }}
      >
        {button}
      </div>
      <div
        style={{
          color: theme.muted,
          fontFamily: `${theme.fontBody}, Inter, sans-serif`,
          fontSize: layout.smallSize,
          letterSpacing: "0.04em",
          opacity: meta,
        }}
      >
        {domain}
      </div>
    </AbsoluteFill>
  );
};
