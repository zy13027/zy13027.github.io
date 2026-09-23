import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Matches "<!-- @include path/relative/to/project/root.html -->", one per line.
const INCLUDE_RE = /<!--\s*@include\s+(\S+)\s*-->/g;

/**
 * Tiny local include plugin: stitches HTML partials into index.html at both
 * dev and build time, so the page is fully present at first paint (no
 * runtime fetch). Includes may nest. A missing include throws a clear,
 * build-stopping error naming the offending path.
 */
function htmlIncludePlugin() {
  let root = process.cwd();
  const includedFiles = new Set();

  function resolveInclude(includePath, fromFile) {
    // Paths in @include are resolved from the project root, per the include
    // syntax's own contract — not relative to the including file — so a
    // partial can itself @include another partial using the same root-relative
    // style without needing to know its own location.
    const abs = resolve(root, includePath);
    if (!existsSync(abs)) {
      throw new Error(
        `[html-include] Missing include "${includePath}" referenced from ` +
        `${fromFile}. Resolved to: ${abs}`
      );
    }
    return abs;
  }

  function expand(html, fromFile, seen) {
    return html.replace(INCLUDE_RE, (match, includePath) => {
      const abs = resolveInclude(includePath, fromFile);
      if (seen.has(abs)) {
        throw new Error(
          `[html-include] Circular @include detected at "${includePath}" ` +
          `(from ${fromFile}).`
        );
      }
      includedFiles.add(abs);
      const partial = readFileSync(abs, 'utf-8');
      const nextSeen = new Set(seen);
      nextSeen.add(abs);
      return expand(partial, abs, nextSeen);
    });
  }

  return {
    name: 'html-include',
    configResolved(config) {
      root = config.root || process.cwd();
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        includedFiles.clear();
        return expand(html, ctx.filename || resolve(root, 'index.html'), new Set());
      }
    },
    configureServer(server) {
      // Re-run the include expansion (and reload the browser) whenever any
      // previously-included partial changes, even though the dev server only
      // watches index.html by default.
      for (const file of includedFiles) {
        server.watcher.add(file);
      }
      server.watcher.on('change', (file) => {
        if (includedFiles.has(file)) {
          server.watcher.add(file);
          server.ws.send({ type: 'full-reload' });
        }
      });
      server.watcher.on('all', () => {
        for (const file of includedFiles) {
          server.watcher.add(file);
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlIncludePlugin()]
});
