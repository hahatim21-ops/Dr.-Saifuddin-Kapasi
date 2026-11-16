/**
 * Scene registry — tiny and GSAP-free, so component scripts can register
 * their scenes at load without pulling the engine into the first download.
 * The engine (src/lib/scroll.ts, loaded after the first paint) runs every
 * registered scene, and runs scenes registered later straight away.
 */
import type Lenis from 'lenis';

export type MotionMode = 'desktop' | 'touch' | 'reduce';

export interface SceneContext {
  mode: MotionMode;
  desktop: boolean;
  touch: boolean;
  reduce: boolean;
  /** Lenis instance when active (desktop, motion allowed). */
  lenis: Lenis | null;
}

/** A scene sets up animations for one feature; returns an optional cleanup. */
export type Scene = (ctx: SceneContext) => void | (() => void);

export const sceneRegistry: {
  scenes: Map<string, Scene>;
  /** Set by the engine once it is running. */
  onRegister: ((name: string, scene: Scene) => void) | null;
} = { scenes: new Map(), onRegister: null };

/** Register a scene by name (idempotent). Runs on every page load. */
export function registerScene(name: string, scene: Scene) {
  sceneRegistry.scenes.set(name, scene);
  sceneRegistry.onRegister?.(name, scene);
}
