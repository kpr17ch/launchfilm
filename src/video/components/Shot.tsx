import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";

/** A screenshot, or a quiet brand-colored placeholder when the asset is missing. */
export const Shot: React.FC<{ file: string | null; theme: Theme; style?: CSSProperties }> = ({
  file,
  theme,
  style,
}) => {
  if (file) return <Img src={staticFile(file)} style={{ width: "100%", display: "block", ...style }} />;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(160deg, ${theme.surface}, ${theme.primary}33)`,
        ...style,
      }}
    />
  );
};
