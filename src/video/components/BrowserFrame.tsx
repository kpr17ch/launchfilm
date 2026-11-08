import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "../../storyboard/schema.ts";

interface BrowserFrameProps {
  theme: Theme;
  width: number;
  domain: string;
  unit: number;
  children: ReactNode;
  style?: CSSProperties;
}

/** A restrained browser window: traffic lights, a URL pill and the captured page. */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({ theme, width, domain, unit, children, style }) => {
  const chrome = 44 * unit;
  const border = theme.dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  return (
    <div
      style={{
        width,
        borderRadius: 18 * unit,
        overflow: "hidden",
        backgroundColor: theme.surface,
        border: `${Math.max(1, unit)}px solid ${border}`,
        boxShadow: `0 ${40 * unit}px ${120 * unit}px rgba(0,0,0,${theme.dark ? 0.55 : 0.18}), 0 ${8 * unit}px ${24 * unit}px rgba(0,0,0,0.12)`,
        ...style,
      }}
    >
      <div
        style={{
          height: chrome,
          display: "flex",
          alignItems: "center",
          gap: 8 * unit,
          padding: `0 ${16 * unit}px`,
          borderBottom: `${Math.max(1, unit)}px solid ${border}`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
          <div
            key={color}
            style={{ width: 12 * unit, height: 12 * unit, borderRadius: "50%", backgroundColor: color }}
          />
        ))}
        <div
          style={{
            margin: "0 auto",
            padding: `${5 * unit}px ${18 * unit}px`,
            borderRadius: 8 * unit,
            backgroundColor: theme.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: theme.muted,
            fontFamily: `${theme.fontBody}, Inter, sans-serif`,
            fontSize: 15 * unit,
          }}
        >
          {domain}
        </div>
        <div style={{ width: 52 * unit }} />
      </div>
      <div style={{ position: "relative", width, height: width * 0.625, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
