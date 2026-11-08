import { Img, staticFile } from "remotion";
import type { Theme } from "../../storyboard/schema.ts";

/** The captured logo, or a monogram tile in brand colors when none was found. */
export const Logo: React.FC<{ file: string | null; name: string; size: number; theme: Theme }> = ({
  file,
  name,
  size,
  theme,
}) => {
  if (file) {
    return (
      <Img src={staticFile(file)} style={{ height: size, width: "auto", maxWidth: size * 5, objectFit: "contain" }} />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
        color: theme.onPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: `${theme.fontHeading}, Inter, sans-serif`,
        fontWeight: 700,
        fontSize: size * 0.5,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
};
