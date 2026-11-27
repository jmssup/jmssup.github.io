import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { legacyRoutes } from './legacy-routes.mjs';

const root = path.resolve('_site');
const base = 'https://jmssup.github.io';
const read = file => readFileSync(file, 'utf8');
const index = JSON.parse(read(path.join(root, 'static/contentIndex.json')));
const files = readdirSync('content', { recursive: true }).filter(name => name.endsWith('.md')).sort();
const articles = Object.entries(index).filter(([, note]) => note.content.trim());
assert.deepEqual(articles.map(([, note]) => note.filePath).sort(), files, 'Quartz search must include each exported note');
assert(index.index?.content?.trim(), 'Empty Quartz homepage');
assert(index['about/index']?.content?.trim(), 'Empty Quartz about page');
assert(!existsSync(path.join(root, 'search.json')), 'Legacy Jekyll search index is in the Quartz site');

function resolves(reference, baseUrl) {
  const url = new URL(reference, baseUrl);
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  const exists = p => existsSync(p) && statSync(p).isFile();
  return (file.startsWith(root + path.sep) || file === root) &&
    (exists(file) || exists(file + '.html') || exists(path.join(file, 'index.html')));
}

const broken = [];
let checked = 0;
for (const [slug] of articles) {
  const html = load(read(path.join(root, slug + '.html')));
  const url = new URL('/' + (slug === 'index' ? '' : slug.replace(/\/index$/, '/')), base);
  for (const el of html('article a[href], article img[src], article source[src]').toArray()) {
    const ref = el.attribs.href ?? el.attribs.src;
    if (!ref || ref.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
    if (!resolves(ref, url)) broken.push({ slug, ref });
    checked++;
  }
}
assert.deepEqual(broken, [], 'Broken links or media in exported notes');
const redirects = legacyRoutes(index);
for (const [from, to] of redirects) {
  const html = load(read(path.join(root, from, 'index.html')));
  assert.equal(html('meta[http-equiv="refresh"]').attr('content'), '0;url=' + to, from);
  assert.equal(html('meta[name="robots"]').attr('content'), 'noindex', from);
  assert(resolves(to, base), 'Missing redirect target: ' + to);
}
assert.equal(read(path.join(root, 'feed.xml')), read(path.join(root, 'index.xml')));
console.log('PASS: ' + files.length + ' Quartz pages, ' + checked + ' article links and media, and ' + redirects.size + ' legacy redirects.');
