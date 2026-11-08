import { Composition } from "remotion";
import { FORMAT_NAMES, FORMATS, FPS, totalFrames } from "../storyboard/schema.ts";
import { LaunchFilm } from "./LaunchFilm.tsx";
import { sampleStoryboard } from "./sample.ts";

/** One composition per output format; the storyboard decides the length. */
export const Root: React.FC = () => (
  <>
    {FORMAT_NAMES.map((format) => (
      <Composition
        key={format}
        id={`launchfilm-${format}`}
        component={LaunchFilm}
        fps={FPS}
        width={FORMATS[format].width}
        height={FORMATS[format].height}
        durationInFrames={totalFrames(sampleStoryboard)}
        defaultProps={{ storyboard: sampleStoryboard }}
        calculateMetadata={({ props }) => ({ durationInFrames: totalFrames(props.storyboard) })}
      />
    ))}
  </>
);
