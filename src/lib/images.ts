/**
 * Site-level images that don't belong to a content collection.
 * TODO(asset): replace the placeholder with his professional portrait (see TODO.md).
 */
import portraitHero from '../assets/placeholders/portrait-hero.jpg';

export const heroPortrait = {
  src: portraitHero,
  alt: 'Placeholder for a portrait of Dr. Saifuddin Kapasi',
  /** Phones: full width minus gutters. Tablet/desktop: the right-hand column. */
  sizes: '(min-width: 1280px) 590px, (min-width: 1024px) 46vw, (min-width: 768px) 40vw, calc(100vw - 2.5rem)',
  widths: [400, 640, 800, 1000, 1280],
  /** Keep the face in frame when the phone crop gets shorter. */
  position: '50% 30%',
  placeholder: true,
};
