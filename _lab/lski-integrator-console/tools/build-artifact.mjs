#!/usr/bin/env node
// Re-inlines the Vite build (dist/index.html + its built CSS/JS assets) into a single
// self-contained dist/artifact.html fragment — no <!doctype>/<html>/<head>/<body>
// wrapper, no favicon <link>s (an Artifact's icon comes from the publish call's `icon`
// parameter instead) — suitable for pasting back into Claude as a published Artifact.
//
// Run via `npm run artifact` (which runs `vite build` first).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const distDir = resolve(repoRoot, 'dist');
const distIndex = resolve(distDir, 'index.html');

if (!existsSync(distIndex)) {
  console.error(`[build-artifact] ${distIndex} does not exist — run "npm run build" first.`);
  process.exit(1);
}

let html = readFileSync(distIndex, 'utf-8');

function assertNoScriptClose(js, label) {
  if (js.includes('</script')) {
    throw new Error(
      `[build-artifact] Refusing to inline ${label}: it contains a literal "</script" ` +
      `sequence, which would break out of the wrapping <script> tag. Escape it in the ` +
      `source (e.g. "<\\/script") and rebuild.`
    );
  }
}

const inlined = { css: [], js: [] };

// Inline every built stylesheet <link rel="stylesheet" href="...local asset...">
// (Google Fonts links are left as external <link>s — see the keep-list below.)
html = html.replace(
  /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
  (match, href) => {
    if (/^https?:\/\//i.test(href)) return match; // external (Google Fonts) — keep as-is
    const assetPath = resolve(distDir, href.replace(/^\.?\//, ''));
    if (!existsSync(assetPath)) return match;
    const css = readFileSync(assetPath, 'utf-8');
    inlined.css.push({ href, bytes: Buffer.byteLength(css, 'utf-8') });
    return `<style>\n${css}\n</style>`;
  }
);

// Inline every built module <script type="module" src="...local asset...">
html = html.replace(
  /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g,
  (match, src) => {
    if (/^https?:\/\//i.test(src)) return match;
    const assetPath = resolve(distDir, src.replace(/^\.?\//, ''));
    if (!existsSync(assetPath)) return match;
    const js = readFileSync(assetPath, 'utf-8');
    assertNoScriptClose(js, src);
    inlined.js.push({ src, bytes: Buffer.byteLength(js, 'utf-8') });
    return `<script type="module">\n${js}\n</script>`;
  }
);

// Also catch any Vite-generated modulepreload links for chunks we just inlined —
// they're redundant once the module is inlined, so drop them.
html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>\s*/g, '');

// Remove the favicon links — an Artifact's tab icon comes from the publish call's
// `icon` parameter, not from a linked file.
html = html.replace(/<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*>\s*/g, '');

// Strip the document wrapper the Artifact runtime supplies itself: <!doctype>, <html>,
// <head>, <body> (open and close tags), keeping everything that was inside them.
// Note: the tag-name patterns below are anchored with a word boundary (\b) so
// "<head>"/"</head>" don't also match "<header>"/"</header>", which the page's own
// sections use extensively.
html = html
  .replace(/<!doctype[^>]*>\s*/i, '')
  .replace(/<\/?html\b[^>]*>\s*/gi, '')
  .replace(/<\/?head\b[^>]*>\s*/gi, '')
  .replace(/<\/?body\b[^>]*>\s*/gi, '')
  .replace(/<meta charset=["']utf-8["']\s*\/?>\s*/i, '')
  .replace(/<meta name=["']viewport["'][^>]*>\s*/i, '')
  .replace(/<meta name=["']description["'][^>]*>\s*/i, '')
  .trim() + '\n';

const outPath = resolve(distDir, 'artifact.html');
writeFileSync(outPath, html, 'utf-8');

const totalBytes = Buffer.byteLength(html, 'utf-8');
console.log(`[build-artifact] wrote ${outPath} (${(totalBytes / 1024).toFixed(1)} kB)`);
console.log(`[build-artifact] inlined ${inlined.css.length} stylesheet(s):`);
for (const c of inlined.css) console.log(`  - ${c.href}  (${(c.bytes / 1024).toFixed(1)} kB)`);
console.log(`[build-artifact] inlined ${inlined.js.length} module script(s):`);
for (const j of inlined.js) console.log(`  - ${j.src}  (${(j.bytes / 1024).toFixed(1)} kB)`);
console.log('[build-artifact] kept <title> and the Google Fonts <link>s; removed favicon <link>s and the document wrapper.');
