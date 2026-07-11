#!/usr/bin/env node
/**
 * add-hreflang.mjs — insert self-referencing hreflang pairs on transferchair.my pages.
 *
 * Every page on this site is single-language Bahasa Malaysia (html lang="ms"),
 * so the correct annotation is a self-referencing pair per page:
 *   <link rel="alternate" hreflang="ms" href="{canonical}">
 *   <link rel="alternate" hreflang="x-default" href="{canonical}">
 * inserted immediately after the existing <link rel="canonical"> tag.
 *
 * Usage:
 *   node add-hreflang.mjs                    # DRY RUN: list files that would change
 *   node add-hreflang.mjs <file.html> [...]  # apply to specific file(s) only
 *   node add-hreflang.mjs --all              # apply to all root *.html + blog/*.html
 *
 * Idempotent: files already containing an hreflang link are skipped.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Matches the canonical tag anywhere on a line (some generated city pages have
// a fully minified single-line <head>, so no line-start anchor).
const CANONICAL_RE = /<link rel="canonical" href="([^"]+)"\s*\/?>/;

function targetsAll() {
  const rootFiles = readdirSync(ROOT)
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(ROOT, f));
  const blogFiles = readdirSync(join(ROOT, 'blog'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(ROOT, 'blog', f));
  return [...rootFiles, ...blogFiles];
}

function processFile(file, apply) {
  const html = readFileSync(file, 'utf8');
  if (/hreflang=/.test(html)) return 'skip (hreflang already present)';
  const m = html.match(CANONICAL_RE);
  if (!m) return 'ERROR: no canonical tag found';
  const [full, url] = m;
  // Preserve formatting: if the canonical tag sits on its own (indented) line,
  // insert each hreflang link on its own line with the same indent; if the head
  // is minified (tag mid-line), insert inline right after the canonical tag.
  const lineStart = html.lastIndexOf('\n', m.index) + 1;
  const prefix = html.slice(lineStart, m.index);
  const ownLine = /^[ \t]*$/.test(prefix);
  const sep = ownLine ? `\n${prefix}` : '';
  const insertion =
    `${full}${sep}` +
    `<link rel="alternate" hreflang="ms" href="${url}">${sep}` +
    `<link rel="alternate" hreflang="x-default" href="${url}">`;
  if (apply) {
    writeFileSync(file, html.replace(full, insertion), 'utf8');
    return `added hreflang (ms + x-default -> ${url})`;
  }
  return `would add hreflang (ms + x-default -> ${url})`;
}

const args = process.argv.slice(2);

let files;
let apply;
if (args.length === 0) {
  files = targetsAll();
  apply = false;
  console.log('DRY RUN (no files written). Pass --all or explicit filenames to apply.\n');
} else if (args[0] === '--all') {
  files = targetsAll();
  apply = true;
} else {
  files = args;
  apply = true;
}

let changed = 0;
let skipped = 0;
let errors = 0;
for (const f of files) {
  const result = processFile(f, apply);
  if (result.startsWith('ERROR')) errors++;
  else if (result.startsWith('skip')) skipped++;
  else changed++;
  console.log(`${f}: ${result}`);
}
console.log(
  `\n${apply ? 'Changed' : 'Would change'}: ${changed}, skipped: ${skipped}, errors: ${errors} (of ${files.length} files)`
);
