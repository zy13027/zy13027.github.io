import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const site = process.argv[2] ?? "_site";
const asset = "assets/libs/mathjax/tex-mml-chtml.js";
const html = readFileSync(join(site, "index.html"), "utf8");
const script = [...html.matchAll(/<script\b[^>]*>/g)].find(([tag]) =>
  tag.includes(`/${asset}`),
)?.[0];
assert.ok(script, "Built homepage must load the self-hosted MathJax script");

const integrity = script.match(/\bintegrity=["']([^"']+)["']/)?.[1];
assert.ok(integrity, "MathJax must retain its integrity attribute");
const actual = `sha256-${createHash("sha256")
  .update(readFileSync(join(site, asset)))
  .digest("base64")}`;
assert.equal(actual, integrity, "Built MathJax bytes must match the page's integrity hash");
console.log(`MathJax integrity verified: ${actual}`);
