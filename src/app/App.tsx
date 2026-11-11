import { useCallback, useEffect, useState } from "react";
import { MotionProvider } from "@/animation";
import { AuthGate } from "@/features/auth/AuthGate";
import { HomeScene } from "@/scenes/home/HomeScene";
import { GalleryScene } from "@/scenes/gallery/GalleryScene";
import { CakeScene } from "@/scenes/cake/CakeScene";
import { LetterScene } from "@/scenes/letter/LetterScene";
import { SceneTransition } from "./SceneTransition";
import { initialScene, nextScene, saveScene, type SceneId } from "./scenes";

/** Shows one scene at a time and moves between them with the bloom transition. */
function Story() {
  const [scene, setScene] = useState<SceneId>(initialScene);
  const [target, setTarget] = useState<SceneId | null>(null);

  useEffect(() => saveScene(scene), [scene]);

  const goNext = useCallback(() => {
    const to = nextScene(scene);
    if (to) setTarget((t) => t ?? to);
  }, [scene]);

  const hasNext = nextScene(scene) !== undefined;

  return (
    <>
      {scene === "home" && <HomeScene onReady={goNext} />}
      {scene === "letter" && <LetterScene onContinue={hasNext ? goNext : undefined} />}
      {scene === "gallery" && <GalleryScene onContinue={hasNext ? goNext : undefined} />}
      {scene === "cake" && <CakeScene onContinue={hasNext ? goNext : undefined} />}
      <SceneTransition
        active={target !== null}
        onCovered={() => target && setScene(target)}
        onDone={() => setTarget(null)}
      />
    </>
  );
}

export function App() {
  return (
    <MotionProvider>
      <AuthGate>
        <Story />
      </AuthGate>
    </MotionProvider>
  );
}
