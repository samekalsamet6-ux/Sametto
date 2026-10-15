import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeTaskLabels from './src/lib/rehype-task-labels.mjs';

export default defineConfig({
  // Yayın adresi (tek kaynak): sitemap, robots.txt ve canonical/OG bağlantıları buradan türetilir.
  site: 'https://lepistes-rehberi.samekalsamet6.workers.dev',
  markdown: { processor: unified({ rehypePlugins: [rehypeTaskLabels] }) },
  integrations: [mdx(), sitemap()],
});
