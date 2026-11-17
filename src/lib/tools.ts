/**
 * What component scripts import instead of the engine itself.
 *
 * The engine (GSAP, ScrollTrigger, SplitText, Lenis …) is downloaded only after
 * the page's first paint (see Base.astro), so it never competes with the hero
 * portrait (the LCP image). These exports are live bindings: they are filled in
 * by `provide()` the moment the engine loads, and scenes only run after that —
 * so inside a scene they are always set. Never use them at module top level.
 */
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { SplitText as SplitTextType } from 'gsap/SplitText';
import type * as Engine from './scroll';

export { registerScene } from './scenes';
export type { Scene, SceneContext, MotionMode } from './scenes';

export let gsap: typeof gsapType;
export let ScrollTrigger: typeof ScrollTriggerType;
export let SplitText: typeof SplitTextType;
export let splitText: typeof Engine.splitText;
export let createOdometer: typeof Engine.createOdometer;
export let getLenis: typeof Engine.getLenis;
export let scrollToTarget: typeof Engine.scrollToTarget;
export let loadFlip: typeof Engine.loadFlip;
export let revealTrigger: typeof Engine.revealTrigger;
export let groupStagger: typeof Engine.groupStagger;
export let afterCurtain: typeof Engine.afterCurtain;
export let whenNear: typeof Engine.whenNear;
export let isPhone: typeof Engine.isPhone;
export let fadeUp: typeof Engine.fadeUp;

/** Called once by the engine when it loads. */
export function provide(t: {
  gsap: typeof gsapType;
  ScrollTrigger: typeof ScrollTriggerType;
  SplitText: typeof SplitTextType;
  splitText: typeof Engine.splitText;
  createOdometer: typeof Engine.createOdometer;
  getLenis: typeof Engine.getLenis;
  scrollToTarget: typeof Engine.scrollToTarget;
  loadFlip: typeof Engine.loadFlip;
  revealTrigger: typeof Engine.revealTrigger;
  groupStagger: typeof Engine.groupStagger;
  afterCurtain: typeof Engine.afterCurtain;
  whenNear: typeof Engine.whenNear;
  isPhone: typeof Engine.isPhone;
  fadeUp: typeof Engine.fadeUp;
}) {
  ({ gsap, ScrollTrigger, SplitText, splitText, createOdometer, getLenis, scrollToTarget, loadFlip, revealTrigger, groupStagger, afterCurtain, whenNear, isPhone, fadeUp } = t);
}
