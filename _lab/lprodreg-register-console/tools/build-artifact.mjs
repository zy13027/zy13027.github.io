// Re-inlines the Vite build into dist/artifact.html: a single-file page with the built
// CSS as an inline <style>, the built JS as an inline <script type="module">, and no
// document wrapper — ready to paste back into a Claude Artifact (the Artifact runtime
// supplies <!doctype>/<html>/<head>/<body> itself, and its own icon via the publish
// call's `icon` parameter, so favicon <link>s are dropped here too).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const distIndex = resolve(distDir, "index.html");

if (!existsSync(distIndex)) {
  console.error('dist/index.html not found — run "npm run build" first.');
  process.exit(1);
}

let html = readFileSync(distIndex, "utf-8");

function readAsset(hrefOrSrc) {
  // built asset URLs are relative ("./assets/xyz.js") because of base: './'
  const clean = hrefOrSrc.replace(/^\.\//, "").replace(/^\//, "");
  const abs = resolve(distDir, clean);
  if (!existsSync(abs)) {
    throw new Error(`[build-artifact] referenced asset not found on disk: ${hrefOrSrc} (resolved to ${abs})`);
  }
  return readFileSync(abs, "utf-8");
}

let inlinedCss = 0;
let inlinedJs = 0;
let cssBytes = 0;
let jsBytes = 0;

// Inline every built (local) stylesheet <link rel="stylesheet" href="...">.
// The Google Fonts stylesheet link is external (an absolute https:// URL) and
// must stay a <link> — it is kept as-is, per the rule below.
html = html.replace(
  /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
  (match, href) => {
    if (/^https?:\/\//i.test(href)) return match; // e.g. Google Fonts — leave untouched
    const css = readAsset(href);
    inlinedCss++;
    cssBytes += css.length;
    return `<style>\n${css}\n</style>`;
  }
);

// Inline the built module script(s) <script type="module" src="...">
html = html.replace(
  /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g,
  (match, src) => {
    const js = readAsset(src);
    if (js.includes("</script")) {
      throw new Error(
        `[build-artifact] refusing to inline ${src}: its contents contain a literal "</script" sequence, which would break the inlined <script> tag.`
      );
    }
    inlinedJs++;
    jsBytes += js.length;
    return `<script type="module">\n${js}\n</script>`;
  }
);

// Vite may also emit modulepreload <link> tags for the entry chunk — drop them,
// the inlined module script no longer needs preloading.
html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>\s*/g, "");

// Remove favicon links — an Artifact's tab icon comes from the publish call's
// `icon` parameter, not from a <link rel="icon">.
html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>\s*/g, "");
html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>\s*/g, "");

// Strip the document wrapper — the Artifact runtime supplies its own
// <!doctype>/<html>/<head>/<body>.
html = html.replace(/^\s*<!doctype[^>]*>\s*/i, "");
html = html.replace(/<html[^>]*>\s*/i, "");
html = html.replace(/<\/html>\s*$/i, "");
html = html.replace(/<head[^>]*>\s*/i, "");
html = html.replace(/<\/head>\s*/i, "");
html = html.replace(/<body[^>]*>\s*/i, "");
html = html.replace(/<\/body>\s*$/i, "");
html = html.replace(/<meta charset=["']utf-8["']\s*\/?>\s*/i, "");
html = html.replace(
  /<meta name=["']viewport["'][^>]*>\s*/i,
  ""
);
html = html.replace(/<meta name=["']description["'][^>]*>\s*/i, "");

html = html.trim() + "\n";

const outPath = resolve(distDir, "artifact.html");
writeFileSync(outPath, html, "utf-8");

const totalBytes = Buffer.byteLength(html, "utf-8");
console.log(`[build-artifact] wrote dist/artifact.html (${(totalBytes / 1024).toFixed(1)} kB)`);
console.log(`[build-artifact] inlined ${inlinedCss} stylesheet(s) (${(cssBytes / 1024).toFixed(1)} kB CSS)`);
console.log(`[build-artifact] inlined ${inlinedJs} script(s) (${(jsBytes / 1024).toFixed(1)} kB JS)`);
console.log(`[build-artifact] kept <title> and the Google Fonts <link> tags; removed the document wrapper and favicon links.`);
