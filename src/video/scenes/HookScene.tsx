import { AbsoluteFill } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";
import { Words } from "../components/Words.tsx";
import { useLayout } from "../layout.ts";

export const HookScene: React.FC<{ text: string; theme: Theme }> = ({ text, theme }) => {
  const layout = useLayout();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: layout.padding }}>
      <div
        style={{
          maxWidth: layout.orientation === "landscape" ? layout.width * 0.72 : layout.width * 0.86,
          textAlign: "center",
          color: theme.foreground,
          fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
          fontSize: layout.hookSize,
          fontWeight: 650,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
          textWrap: "balance",
        }}
      >
        <Words
          text={text}
          delay={4}
          stagger={4}
          highlightLast={`linear-gradient(90deg, ${theme.primary}, ${theme.accent})`}
        />
      </div>
    </AbsoluteFill>
  );
};
