import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so `dist/` also opens straight from the filesystem or
  // from a sub-path on an Industrial Edge / IIS host without a rewrite rule.
  base: './',

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: 'dist',
    target: 'es2022',
    // The page is one document with a handful of small modules; a single bundle
    // loads faster here than several chunked requests.
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
