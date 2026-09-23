import { defineConfig } from "vite";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const INCLUDE_RE = /<!--\s*@include\s+(\S+)\s*-->/g;

/**
 * Tiny local "@include" plugin: stitches HTML partials into index.html at both
 * dev and build time so the page is fully present at first paint (no runtime
 * fetch, no dependency). Include paths are resolved from the project root, and
 * an included file may itself contain further @include lines (nesting).
 */
function htmlIncludePlugin(root) {
  function resolveIncludePath(includePath) {
    return includePath.startsWith("/")
      ? resolve(root, includePath.slice(1))
      : resolve(root, includePath);
  }

  /** every absolute include path touched while expanding the last-seen index.html */
  let lastIncludedFiles = [];

  function expandAndTrack(html) {
    lastIncludedFiles = [];
    return html.replace(INCLUDE_RE, function includeOnce(match, includePath) {
      const abs = resolveIncludePath(includePath);
      if (!existsSync(abs)) {
        throw new Error(
          `[html-include] included file not found: "${includePath}" (resolved to ${abs})`
        );
      }
      lastIncludedFiles.push(abs);
      const partial = readFileSync(abs, "utf-8");
      // allow nesting: expand @include lines inside the partial too
      return partial.replace(INCLUDE_RE, includeOnce);
    });
  }

  return {
    name: "html-include",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return expandAndTrack(html);
      },
    },
    configureServer(server) {
      // watch every partial that has been included so far, and full-reload the
      // page whenever one of them changes (a partial is never imported as a
      // module, so Vite's own HMR graph doesn't know about it).
      server.watcher.add(resolve(root, "src/partials"));
      server.watcher.add(resolve(root, "src/sections"));
      server.watcher.on("change", (file) => {
        if (lastIncludedFiles.includes(resolve(file))) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

export default defineConfig({
  root: ".",
  base: "./",
  plugins: [htmlIncludePlugin(process.cwd())],
});
