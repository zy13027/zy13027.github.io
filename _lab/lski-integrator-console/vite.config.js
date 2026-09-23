import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+([^\s]+)\s*-->/g;

/**
 * Tiny local "include" plugin: replaces `<!-- @include path/to/file.html -->` lines in
 * index.html (and in any included file, so includes can nest) with that file's raw
 * content, resolved from the project root. This is a build-time/dev-time text splice —
 * no client-side fetch, no dependency — so the page is fully present at first paint,
 * exactly like the original single-file artifact.
 */
function includeHtml() {
  let root = process.cwd();
  let devServer = null;
  const includedFiles = new Set();

  function resolveInclude(rawPath, fromFile) {
    const abs = resolve(root, rawPath);
    if (!existsSync(abs)) {
      throw new Error(
        `[vite-plugin-include] Missing include "${rawPath}"` +
        (fromFile ? ` (referenced from ${fromFile})` : '') +
        ` — expected a file at ${abs}`
      );
    }
    return abs;
  }

  function expand(html, fromFile) {
    return html.replace(INCLUDE_RE, (match, rawPath) => {
      const abs = resolveInclude(rawPath, fromFile);
      includedFiles.add(abs);
      const partial = readFileSync(abs, 'utf-8');
      // allow nesting: an included partial may itself contain @include lines
      return expand(partial, abs);
    });
  }

  return {
    name: 'vite-plugin-include',
    configResolved(config) {
      root = config.root || process.cwd();
    },
    configureServer(server) {
      devServer = server;
    },
    handleHotUpdate({ file, server }) {
      if (includedFiles.has(resolve(file))) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        includedFiles.clear();
        const expanded = expand(html, ctx.filename || resolve(root, 'index.html'));
        // Partials live under src/, which Vite already watches, but they aren't script
        // or link tags Vite's module graph knows about — watch each one explicitly too,
        // and (belt and braces, alongside handleHotUpdate above) send a full-reload
        // when one changes, since there is no HMR boundary for text spliced straight
        // into index.html.
        for (const abs of includedFiles) {
          if (this && typeof this.addWatchFile === 'function') this.addWatchFile(abs);
          if (devServer) devServer.watcher.add(abs);
        }
        return expanded;
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [includeHtml()]
});
