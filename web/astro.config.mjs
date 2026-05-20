// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://theme-atoms.com',
  integrations: [react()],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
