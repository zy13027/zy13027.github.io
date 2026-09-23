#!/usr/bin/env node
// Builds the lab pages: _lab/<slug>/ (sources) → lab/<slug>/index.html (published, committed).
//
//   npm run lab:build              build every page
//   npm run lab:build -- <slug>…   build only the named pages
//
// A source is either a Vite package (has package.json: built with its own `npm run build`,
// then CSS/JS are inlined) or a single self-contained index.html. Every output is one file
// with no runtime requests off-site — Google Fonts are stripped, because they are blocked
// or unreliable in mainland China, and each page already declares system fallback fonts.
//
// The build fails if a page still loads anything external, if a local asset was left
// un-inlined, if a source or output contains a phrase from DENYLIST (private paths,
// internal-only markings — see SETUP.md "Lab pages"), or if _data/lab.yml and _lab/
// disagree about which pages exist.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, '_lab');
const outRoot = join(root, 'lab');

const DENYLIST = new RegExp(
  [
    'OneDrive', 'Job Hunting', 'Geely', 'YoboGo', '优宝特', 'study-offline',
    '00_Siemens', 'SiemensAutomationSoftware', 'motion-control-rag', 'rag domain',
    'Siemens-internal', 'keep this page private', 'hunting zone', 'Handout only',
    'reference folder', 'In your folder', 'Asked for as', String.raw`[A-Z]:\\Users\\`,
  ].join('|'),
  'i'
);
const SCANNED_EXT = new Set(['.html', '.js', '.mjs', '.css', '.md', '.json', '.svg']);

const fail = (msg) => { console.error(`[lab] ✗ ${msg}`); process.exit(1); };
const rel = (p) => relative(root, p).replaceAll('\\', '/');

// npm is a .cmd shim on Windows, which needs a shell; the arguments are fixed strings.
function run(command, cwd) {
  const r = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) fail(`${command} failed in ${rel(cwd)}`);
}

// ---------- sources ----------

function buildVite(dir) {
  if (!existsSync(join(dir, 'node_modules'))) {
    run(`npm ${existsSync(join(dir, 'package-lock.json')) ? 'ci' : 'install'} --no-audit --no-fund`, dir);
  }
  run('npm run build', dir);
  const dist = join(dir, 'dist');
  let html = readFileSync(join(dist, 'index.html'), 'utf8');
  const local = (ref) => !/^(https?:)?\/\//i.test(ref);

  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || !local(href)) return tag;
    return `<style>\n${readFileSync(join(dist, href), 'utf8')}\n</style>`;
  });
  html = html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi, (tag, src) => {
    if (!local(src)) return tag;
    const js = readFileSync(join(dist, src), 'utf8').replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, '');
    if (js.includes('</script')) fail(`${rel(dir)}: ${src} contains "</script" and cannot be inlined`);
    return `<script type="module">\n${js}\n</script>`;
  });
  return html
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*>\s*/gi, '');
}

// ---------- transforms shared by every page ----------

const BAR = `<div class="zylab-bar"><a href="/lab/">&larr; Zinan Yang &middot; lab</a></div>
<style>
.zylab-bar{position:relative;z-index:1000;padding:7px 16px;border-bottom:1px solid rgba(128,128,128,.28);
  font:500 12px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
  letter-spacing:.02em}
.zylab-bar a{color:inherit;opacity:.78;text-decoration:none}
.zylab-bar a:hover,.zylab-bar a:focus-visible{opacity:1;text-decoration:underline}
</style>`;

function finish(html, slug) {
  // Off-site fonts: drop the stylesheet and its preconnects.
  html = html.replace(/[ \t]*<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>[ \t]*\r?\n?/gi, '');

  // <html lang>, and <title> in <head> with the site name.
  html = html.replace(/<html\b(?![^>]*\blang=)([^>]*)>/i, '<html lang="en"$1>');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!title) fail(`${slug}: no <title>`);
  html = html.replace(title[0], '');
  const text = title[1].trim().replace(/ · Zinan Yang$/, '');
  html = html.replace(/<\/head>/i, `<title>${text} · Zinan Yang</title>\n</head>`);

  // Back-to-lab bar, once, as the first thing in <body>.
  if (!html.includes('class="zylab-bar"')) html = html.replace(/<body\b[^>]*>/i, (b) => `${b}\n${BAR}`);
  return html;
}

// ---------- gates ----------

function checkOutput(html, slug) {
  const external =
    html.match(/fonts\.(?:googleapis|gstatic)\.com/i) ||
    html.match(/<(?:script|img|iframe|source|video|audio)\b[^>]*\bsrc=["'](?:https?:)?\/\/[^"']+/i) ||
    html.match(/<link\b(?![^>]*\brel=["'](?:canonical|alternate)["'])[^>]*\bhref=["'](?:https?:)?\/\/[^"']+/i) ||
    html.match(/@import\s+(?:url\()?["']?(?:https?:)?\/\//i);
  if (external) fail(`${slug}: still loads something off-site: ${external[0].slice(0, 120)}`);
  const unInlined = html.match(/(?:src|href)=["']\.?\/?assets\/[^"']+/i);
  if (unInlined) fail(`${slug}: local asset not inlined: ${unInlined[0]}`);
  const bad = html.match(DENYLIST);
  if (bad) fail(`${slug}: output contains denylisted "${bad[0]}"`);
}

function scanSources(dir) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', 'package-lock.json'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { scanSources(p); continue; }
    if (!SCANNED_EXT.has(extname(name).toLowerCase())) continue;
    const lines = readFileSync(p, 'utf8').split('\n');
    const i = lines.findIndex((l) => DENYLIST.test(l));
    if (i >= 0) fail(`${rel(p)}:${i + 1} contains denylisted "${lines[i].match(DENYLIST)[0]}"`);
  }
}

// ---------- main ----------

const all = readdirSync(srcRoot).filter((d) => statSync(join(srcRoot, d)).isDirectory()).sort();
const listed = [...readFileSync(join(root, '_data', 'lab.yml'), 'utf8').matchAll(/^\s*-?\s*slug:\s*([\w-]+)/gm)].map((m) => m[1]);
const unlisted = all.filter((s) => !listed.includes(s));
const missing = listed.filter((s) => !all.includes(s));
if (unlisted.length || missing.length) {
  fail(`_data/lab.yml and _lab/ disagree — no data entry: [${unlisted}], no source: [${missing}]`);
}

const wanted = process.argv.slice(2);
const unknown = wanted.filter((s) => !all.includes(s));
if (unknown.length) fail(`unknown page(s): ${unknown.join(', ')}`);
const slugs = wanted.length ? wanted : all;

scanSources(srcRoot);
if (!wanted.length) rmSync(outRoot, { recursive: true, force: true });

for (const slug of slugs) {
  const dir = join(srcRoot, slug);
  const isVite = existsSync(join(dir, 'package.json'));
  const source = isVite ? buildVite(dir) : readFileSync(join(dir, 'index.html'), 'utf8');
  const html = finish(source, slug);
  checkOutput(html, slug);
  const out = join(outRoot, slug, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`[lab] ✓ ${rel(out)}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB  (${isVite ? 'vite' : 'single file'})`);
}
