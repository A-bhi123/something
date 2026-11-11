/** Every scene of the story, in order. Add the next scene here and give it a case in App.tsx. */
export const sceneOrder = ["home", "letter", "gallery", "cake"] as const;
export type SceneId = (typeof sceneOrder)[number];

const STORAGE_KEY = "birthday.scene";

export function nextScene(id: SceneId): SceneId | undefined {
  return sceneOrder[sceneOrder.indexOf(id) + 1];
}

/** Where to start: the saved scene (so a refresh does not lose progress); in development `?scene=letter` jumps straight to a scene. */
export function initialScene(): SceneId {
  try {
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search).get("scene");
      if (q && (sceneOrder as readonly string[]).includes(q)) return q as SceneId;
    }
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved && (sceneOrder as readonly string[]).includes(saved)) return saved as SceneId;
  } catch {
    /* storage can be blocked; start from the beginning */
  }
  return "home";
}

export function saveScene(id: SceneId): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
