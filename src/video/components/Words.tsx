import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface WordsProps {
  text: string;
  delay?: number;
  stagger?: number;
  style?: CSSProperties;
  /** Paints the last word with this CSS background (e.g. a gradient). */
  highlightLast?: string;
}

/** Reveals a line word by word: a short rise out of a soft blur. */
export const Words: React.FC<WordsProps> = ({ text, delay = 0, stagger = 3, style, highlightLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ").filter(Boolean);
  return (
    <span style={{ display: "inline", ...style }}>
      {words.map((word, i) => {
        const progress = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 200, mass: 0.6 } });
        const isHighlight = highlightLast && i === words.length - 1 && words.length > 1;
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: progress,
              transform: `translateY(${interpolate(progress, [0, 1], [0.35, 0])}em)`,
              filter: `blur(${interpolate(progress, [0, 1], [10, 0])}px)`,
              ...(isHighlight
                ? { backgroundImage: highlightLast, WebkitBackgroundClip: "text", color: "transparent" }
                : {}),
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
};
