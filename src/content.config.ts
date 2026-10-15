import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const level = z.enum(['baslangic', 'orta', 'ileri']);

const guide = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200),
    level,
    order: z.number(),
    readingMinutes: z.number().default(5),
    last_reviewed: z.coerce.date(),
    needs_verification: z.boolean().default(false),
    evidence: z.enum(['kaynakli', 'karma', 'topluluk']).optional(),
  }),
});

const wiki = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200),
    category: z.string(),
    level,
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    last_reviewed: z.coerce.date(),
    confidence: z.enum(['yuksek', 'orta', 'dusuk']).default('orta'),
    needs_verification: z.boolean().default(false),
    evidence: z.enum(['kaynakli', 'karma', 'topluluk']).optional(),
  }),
});

export const collections = { guide, wiki };
