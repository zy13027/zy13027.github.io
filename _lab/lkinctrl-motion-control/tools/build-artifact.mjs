#!/usr/bin/env node
// Re-inlines the Vite production build into dist/artifact.html: a single
// fragment (no document wrapper) suitable for re-publishing as a Claude
// Artifact — the mirror image of what the Artifact runtime does when it
// wraps a published file in <!doctype>/<html>/<head>/<body>.
//
// Run via `npm run artifact` (vite build && node tools/build-artifact.mjs).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const distIndex = resolve(distDir, 'index.html');

if (!existsSync(distIndex)) {
  console.error('[build-artifact] dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

let html = readFileSync(distIndex, 'utf-8');

const inlined = { css: [], js: [] };

// --- Inline built stylesheets (local <link rel="stylesheet" href="...">) as <style> ---
// Google Fonts' own stylesheet link (an absolute https:// URL) is left alone.
html = html.replace(
  /<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
  (tag) => {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return tag;
    const href = hrefMatch[1];
    if (/^https?:\/\//i.test(href)) {
      // External (Google Fonts) — keep as a real <link>.
      return tag;
    }
    const assetPath = resolve(distDir, href.replace(/^\.?\//, ''));
    if (!existsSync(assetPath)) {
      console.error(`[build-artifact] Referenced stylesheet not found on disk: ${href}`);
      process.exit(1);
    }
    const css = readFileSync(assetPath, 'utf-8');
    inlined.css.push({ href, bytes: Buffer.byteLength(css, 'utf-8') });
    return `<style>\n${css}\n</style>`;
  }
);

// --- Inline the built module script (local <script type="module" src="...">) ---
html = html.replace(
  /<script([^>]*)\ssrc=["']([^"']+)["']([^>]*)><\/script>/gi,
  (tag, before, src, after) => {
    if (/^https?:\/\//i.test(src)) {
      return tag; // external script, leave untouched (none expected here)
    }
    const assetPath = resolve(distDir, src.replace(/^\.?\//, ''));
    if (!existsSync(assetPath)) {
      console.error(`[build-artifact] Referenced script not found on disk: ${src}`);
      process.exit(1);
    }
    const js = readFileSync(assetPath, 'utf-8');
    if (js.includes('</script')) {
      console.error(
        `[build-artifact] Refusing to inline ${src}: its content contains a literal ` +
        `"</script" sequence, which would break out of the inline <script> tag.`
      );
      process.exit(1);
    }
    inlined.js.push({ src, bytes: Buffer.byteLength(js, 'utf-8') });
    const attrs = `${before}${after}`.replace(/\s+/g, ' ').trim();
    const attrsOut = attrs ? ` ${attrs}` : '';
    return `<script${attrsOut}>\n${js}\n</script>`;
  }
);

// --- Strip the document wrapper: <!doctype>, <html>, <head>, <body> tags ---
// Each tag-name boundary is anchored so e.g. "head" never also eats the
// page's own <header> elements (a naive `head[^>]*` would match "header" too).
function stripTag(name) {
  const re = new RegExp(`<\\/?${name}(?:\\s[^>]*)?>`, 'gi');
  html = html.replace(re, '');
}
html = html.replace(/<!doctype[^>]*>/i, '');
stripTag('html');
stripTag('head');
stripTag('body');

// --- Remove favicon links (the Artifact's icon comes from the publish call's `icon` param) ---
html = html.replace(/<link[^>]+rel=["'](?:icon|apple-touch-icon)["'][^>]*>\s*/gi, '');

// --- Tidy stray blank lines left by the removals above ---
html = html.replace(/\n{3,}/g, '\n\n').trim() + '\n';

writeFileSync(resolve(distDir, 'artifact.html'), html, 'utf-8');

const finalBytes = Buffer.byteLength(html, 'utf-8');
console.log('[build-artifact] wrote dist/artifact.html (%d bytes)', finalBytes);
console.log('[build-artifact] inlined %d stylesheet(s):', inlined.css.length);
for (const c of inlined.css) console.log('  -', c.href, `(${c.bytes} bytes)`);
console.log('[build-artifact] inlined %d script(s):', inlined.js.length);
for (const j of inlined.js) console.log('  -', j.src, `(${j.bytes} bytes)`);
