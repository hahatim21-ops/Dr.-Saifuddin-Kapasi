import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Every entry can be flagged as placeholder until he confirms it (see TODO.md). */
const placeholder = z.boolean().default(false);

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // first part of the two-tone title, e.g. "Beyond"
      titleAccent: z.string(), // second part in green, e.g. "Satisfaction"
      subtitle: z.string(),
      status: z.enum(['new-release', 'published', 'forthcoming']),
      published: z.coerce.date().optional(),
      publisher: z.string().optional(),
      isbn: z.string().optional(),
      pitch: z.string(), // two lines max
      quote: z
        .object({ text: z.string(), author: z.string(), role: z.string().optional(), placeholder })
        .optional(),
      excerpt: z.string().optional(),
      buyLinks: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
      cover: image().optional(),
      coverAlt: z.string(),
      sampleChapter: z.string().optional(),
      order: z.number(),
      placeholder,
    }),
});

const programmes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programmes' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
    format: z.string(),
    duration: z.string(),
    audience: z.string(),
    outcomes: z.array(z.string()).default([]),
    placeholder,
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    sourceUrl: z.string().optional(),
    placeholder,
  }),
});

const timeline = defineCollection({
  loader: file('src/content/timeline.json'),
  schema: z.object({
    id: z.string(),
    chapter: z.enum(['customers', 'ventures', 'institutions']),
    years: z.string(),
    startYear: z.number(),
    role: z.string(),
    organisation: z.string(),
    note: z.string().optional(),
    current: z.boolean().default(false),
    placeholder,
  }),
});

/** The three chapters of The Arc (home §2). Entries live in timeline.json. */
const chapters = defineCollection({
  loader: file('src/content/chapters.json'),
  schema: z.object({
    id: z.enum(['customers', 'ventures', 'institutions']),
    order: z.number(),
    title: z.string(),
    years: z.string(),
    summary: z.string(),
    callout: z.object({ title: z.string(), text: z.string() }).optional(),
    placeholder,
  }),
});

/** Four focus areas (home §4), each mapped to the service it leads to. */
const pillars = defineCollection({
  loader: file('src/content/pillars.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    title: z.string(),
    line: z.string(),
    service: z.string(),
    href: z.string(),
    placeholder,
  }),
});

/** Thinking tools (home §6, /frameworks): each drawn as a cycle or a rising sequence. */
const frameworks = defineCollection({
  loader: file('src/content/frameworks.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    title: z.string(),
    source: z.string(),
    summary: z.string(),
    shape: z.enum(['cycle', 'rise']),
    center: z.string().optional(),
    stages: z.array(z.object({ name: z.string(), line: z.string() })).length(4),
    taught: z.string().optional(),
    href: z.string(),
    placeholder,
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    id: z.string(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
    /** Must be true before the quote is published with the person's name. */
    permission: z.boolean().default(false),
    placeholder,
  }),
});

const achievements = defineCollection({
  loader: file('src/content/achievements.json'),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      title: z.string(), // award name — used in alt text with the issuer
      issuer: z.string(),
      year: z.number(),
      date: z.coerce.date(),
      kind: z.enum(['award', 'honour', 'feature']),
      media: z.enum(['certificate', 'ceremony', 'medal', 'magazine']).default('certificate'),
      caption: z.string().optional(),
      image: image().optional(),
      featured: z.boolean().default(false), // shown on the home page (top 4–6)
      placeholder,
    }),
});

const honours = defineCollection({
  loader: file('src/content/honours.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    issuer: z.string(),
    date: z.string(),
    placeholder,
  }),
});

const stats = defineCollection({
  loader: file('src/content/stats.json'),
  schema: z.object({
    id: z.string(),
    value: z.number(),
    suffix: z.string().default(''),
    label: z.string(),
    order: z.number(),
    placeholder,
  }),
});

const gallery = defineCollection({
  loader: file('src/content/gallery.json'),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      caption: z.string(), // "Kampala convocation"
      year: z.number(),
      alt: z.string(),
      image: image().optional(),
      consent: z.boolean().default(false), // people shown have agreed
      order: z.number(),
      placeholder,
    }),
});

export const collections = {
  books,
  programmes,
  insights,
  timeline,
  chapters,
  pillars,
  frameworks,
  testimonials,
  achievements,
  honours,
  stats,
  gallery,
};
