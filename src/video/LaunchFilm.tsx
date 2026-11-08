import { loadFont } from "@remotion/fonts";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import type { Scene, Storyboard, Theme } from "../storyboard/schema.ts";
import { Backdrop } from "./components/Backdrop.tsx";
import { CtaScene } from "./scenes/CtaScene.tsx";
import { FeatureScene } from "./scenes/FeatureScene.tsx";
import { HookScene } from "./scenes/HookScene.tsx";
import { RevealScene } from "./scenes/RevealScene.tsx";
import { ShowcaseScene } from "./scenes/ShowcaseScene.tsx";

// Inter is the fallback for every text style when the brand font is not on Google Fonts.
loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export interface LaunchFilmProps extends Record<string, unknown> {
  storyboard: Storyboard;
}

/** Loads the brand fonts captured next to the storyboard and holds rendering until they are ready. */
function useBrandFonts(theme: Theme) {
  const [handle] = useState(() => delayRender("Loading brand fonts"));
  useEffect(() => {
    Promise.all(
      theme.fontFiles.map((font) =>
        loadFont({ family: font.family, url: staticFile(font.file), weight: font.weight, style: font.style }).catch(
          () => {},
        ),
      ),
    ).finally(() => continueRender(handle));
  }, [theme.fontFiles, handle]);
}

function renderScene(scene: Scene, theme: Theme) {
  switch (scene.type) {
    case "hook":
      return <HookScene text={scene.text} theme={theme} />;
    case "reveal":
      return <RevealScene name={scene.name} tagline={scene.tagline} logo={scene.logo} theme={theme} />;
    case "showcase":
      return (
        <ShowcaseScene
          hero={scene.hero}
          page={scene.page}
          pageAspect={scene.pageAspect}
          caption={scene.caption}
          domain={scene.domain}
          theme={theme}
        />
      );
    case "feature":
      return (
        <FeatureScene
          index={scene.index}
          total={scene.total}
          title={scene.title}
          caption={scene.caption}
          screenshot={scene.screenshot}
          theme={theme}
        />
      );
    case "cta":
      return (
        <CtaScene
          headline={scene.headline}
          button={scene.button}
          domain={scene.domain}
          logo={scene.logo}
          name={scene.name}
          theme={theme}
        />
      );
  }
}

export const LaunchFilm: React.FC<LaunchFilmProps> = ({ storyboard }) => {
  const { theme, scenes, transitionFrames } = storyboard;
  useBrandFonts(theme);
  return (
    <AbsoluteFill>
      <Backdrop theme={theme} />
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={scene.durationInFrames}>
              {renderScene(scene, theme)}
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1 && transitionFrames > 0) {
            items.push(
              <TransitionSeries.Transition
                key={`transition-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />,
            );
          }
          return items;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
