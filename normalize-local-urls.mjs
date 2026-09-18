#!/usr/bin/env node
/**
 * normalize-local-urls.mjs — make every same-site URL in the HTML root-absolute and space-safe.
 *
 * Why (Google Search Console crawl 404s):
 *  - Relative refs like href="styles.css" resolve against the *requested* URL, so when a
 *    page is fetched as /transfer-chair-ipoh.html/ the browser/crawler asks for
 *    /transfer-chair-ipoh.html/styles.css (404). Root-absolute refs (/styles.css)
 *    resolve the same from any URL.
 *  - Unencoded spaces in image URLs ("images/Transfer Hoist (Electric).webp") break inside srcset
 *    (space is the candidate separator) and get truncated by crawlers (/images/Transfer).
 *
 * What it rewrites (outside <script> bodies):
 *  - src, href, srcset, imagesrcset, data-src, poster: relative paths -> "/..." resolved against
 *    the file's folder; spaces -> %20; ".../index.html" -> ".../" (keeps #fragment / ?query).
 *  - og:image / twitter:image style content="https://<site>/..." -> spaces -> %20.
 *  - JSON-LD <script type="application/ld+json">: "https://<site>/..." strings -> spaces -> %20.
 * Leaves alone: external URLs, mailto:/tel:/javascript:/data:, #fragments, {{TEMPLATE}} tokens.
 *
 * Usage:
 *   node normalize-local-urls.mjs                    # DRY RUN: list files that would change
 *   node normalize-local-urls.mjs --all              # apply to all root *.html (+ blog/*.html)
 *   node normalize-local-urls.mjs <file.html> [...]  # apply to specific file(s)
 *
 * Idempotent: running it again changes nothing.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://transferchair.my';

// scheme:, //protocol-relative, #fragment, ?query, {{template}} at start
const NON_PATH_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?|\{\{)/i;
const URL_ATTRS = new Set(['src', 'href', 'data-src', 'poster']);
const SRCSET_ATTRS = new Set(['srcset', 'imagesrcset']);

const encodeSpaces = (u) => u.replace(/ /g, '%20');
const indexToSlash = (u) => u.replace(/(^|\/)index\.html(?=$|[?#])/, '$1');

function normalizeUrl(value, fileDir) {
  if (value === '') return value;
  if (value.startsWith(SITE + '/')) return encodeSpaces(value);
  if (NON_PATH_RE.test(value)) return value;
  if (value.startsWith('/')) return indexToSlash(encodeSpaces(value));
  const m = value.match(/^([^?#]*)(.*)$/s);
  const resolved = posix.normalize(posix.join('/', fileDir, m[1]));
  return indexToSlash(encodeSpaces(resolved + m[2]));
}

function normalizeSrcset(value, fileDir) {
  return value
    .split(/\s*,\s*/)
    .map((candidate) => {
      const c = candidate.trim();
      const m = c.match(/^(.*?)(\s+\d+(?:\.\d+)?[wx])?$/s);
      return normalizeUrl(m[1], fileDir) + (m[2] || '');
    })
    .join(', ');
}

function normalizeTagAttrs(markup, fileDir) {
  return markup.replace(
    /(\s)(src|href|srcset|imagesrcset|data-src|poster|content)="([^"]*)"/g,
    (all, ws, name, value) => {
      let out = value;
      if (URL_ATTRS.has(name)) out = normalizeUrl(value, fileDir);
      else if (SRCSET_ATTRS.has(name)) out = normalizeSrcset(value, fileDir);
      else if (name === 'content' && value.startsWith(SITE + '/')) out = encodeSpaces(value);
      return `${ws}${name}="${out}"`;
    }
  );
}

function normalizeJsonLd(json) {
  const siteRe = new RegExp(`"(${SITE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"]*)"`, 'g');
  return json.replace(siteRe, (all, url) => `"${encodeSpaces(url)}"`);
}

function normalizeHtml(html, fileDir) {
  let out = '';
  let last = 0;
  const scriptRe = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi;
  for (const m of html.matchAll(scriptRe)) {
    out += normalizeTagAttrs(html.slice(last, m.index), fileDir);
    const [, open, body, close] = m;
    const isLd = /type=["']application\/ld\+json["']/i.test(open);
    out += normalizeTagAttrs(open, fileDir) + (isLd ? normalizeJsonLd(body) : body) + close;
    last = m.index + m[0].length;
  }
  out += normalizeTagAttrs(html.slice(last), fileDir);
  return out;
}

function targetsAll() {
  const files = readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => join(ROOT, f));
  const blog = join(ROOT, 'blog');
  if (existsSync(blog)) {
    files.push(...readdirSync(blog).filter((f) => f.endsWith('.html')).map((f) => join(blog, f)));
  }
  return files;
}

const args = process.argv.slice(2);
const apply = args.length > 0;
const files = args.length === 0 || args[0] === '--all' ? targetsAll() : args.map((f) => resolve(f));
if (!apply) console.log('DRY RUN (no files written). Pass --all or explicit filenames to apply.\n');
let changed = 0;
for (const file of files) {
  const fileDir = relative(ROOT, dirname(file)).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  const next = normalizeHtml(html, fileDir);
  if (next !== html) {
    changed++;
    if (apply) writeFileSync(file, next, 'utf8');
    console.log(`${apply ? 'updated' : 'would update'}: ${relative(ROOT, file)}`);
  }
}
console.log(`\n${apply ? 'Changed' : 'Would change'}: ${changed} of ${files.length} files`);
