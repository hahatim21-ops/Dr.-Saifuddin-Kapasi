/**
 * Builds the AchievementLightbox props from the achievements collection:
 * optimised thumbnails and full-size sources (AVIF + WebP + JPEG fallback),
 * captions and alt text (award name + issuer, as the brief requires).
 * Shared by the home wall and the /achievements page.
 */
import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import type { Achievement } from '../islands/AchievementLightbox.tsx';

async function sources(src: ImageMetadata, widths: number[], fallbackWidth: number) {
  const usable = widths.filter((w) => w <= src.width);
  const [avif, webp, fallback] = await Promise.all([
    getImage({ src, widths: usable, format: 'avif' }),
    getImage({ src, widths: usable, format: 'webp' }),
    getImage({ src, width: Math.min(fallbackWidth, src.width), format: 'jpg' }),
  ]);
  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    fallback: fallback.src,
    width: src.width,
    height: src.height,
  };
}

export async function toAchievements(entries: CollectionEntry<'achievements'>[]): Promise<Achievement[]> {
  const withImages = entries.filter((e) => e.data.image);
  return Promise.all(
    withImages.map(async (e) => {
      const d = e.data;
      const img = d.image!;
      const alt = `${d.placeholder ? 'Placeholder image: ' : ''}${d.title}, ${d.issuer}`;
      return {
        id: e.id,
        title: d.title,
        meta: `${d.issuer} · ${d.year}`,
        alt,
        placeholder: d.placeholder,
        kind: d.kind,
        thumb: await sources(img, [360, 540, 720], 720),
        full: await sources(img, [800, 1200, 1600], 1600),
      };
    })
  );
}
