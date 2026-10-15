import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeTaskLabels from './src/lib/rehype-task-labels.mjs';

export default defineConfig({
  site: 'https://example.com',
  markdown: { processor: unified({ rehypePlugins: [rehypeTaskLabels] }) },
  integrations: [mdx(), sitemap()],
});
