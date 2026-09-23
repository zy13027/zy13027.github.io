import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const INCLUDE_RE = /<!--\s*@include\s+(\S+)\s*-->/g;

/**
 * Replaces every "<!-- @include <path> -->" comment in the served HTML
 * with the contents of that file (path relative to the project root),
 * recursively. The markup ends up static in the served/built HTML —
 * there is no runtime fetch/inject of partials.
 */
function htmlPartials() {
  let root = process.cwd();

  function resolveInclude(path) {
    return resolve(root, path);
  }

  function expand(html, seenStack) {
    return html.replace(INCLUDE_RE, (match, includePath) => {
      const fullPath = resolveInclude(includePath);
      if (seenStack.includes(fullPath)) {
        throw new Error(
          `htmlPartials: circular @include detected for "${includePath}" (${seenStack.join(' -> ')} -> ${fullPath})`
        );
      }
      let contents;
      try {
        contents = readFileSync(fullPath, 'utf-8');
      } catch (err) {
        throw new Error(`htmlPartials: could not read included file "${includePath}" (resolved to ${fullPath}): ${err.message}`);
      }
      return expand(contents, seenStack.concat(fullPath));
    });
  }

  return {
    name: 'html-partials',
    configResolved(config) {
      root = config.root || process.cwd();
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return expand(html, []);
      }
    },
    handleHotUpdate(ctx) {
      const changedFile = ctx.file.replace(/\\/g, '/');
      if (changedFile.includes('/src/partials/')) {
        ctx.server.ws.send({ type: 'full-reload' });
        return [];
      }
    }
  };
}

export default {
  base: './',
  plugins: [htmlPartials()],
  server: {
    host: true
  },
  build: {
    target: 'es2020'
  }
};
