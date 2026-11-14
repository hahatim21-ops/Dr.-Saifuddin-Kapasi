import type { ImageMetadata } from 'astro';
import sharp from 'sharp';

const cache = new Map<string, string>();

/**
 * A ~16px-wide WebP of the image as a data URI (≈300 bytes), generated at build
 * time. Shown blurred behind the real image until it loads (blur-up).
 */
export async function blurDataURL(image: ImageMetadata): Promise<string | undefined> {
  const path = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!path) return undefined;
  const hit = cache.get(path);
  if (hit) return hit;
  try {
    const buf = await sharp(path).resize(16).webp({ quality: 50 }).toBuffer();
    const uri = `data:image/webp;base64,${buf.toString('base64')}`;
    cache.set(path, uri);
    return uri;
  } catch {
    return undefined;
  }
}
