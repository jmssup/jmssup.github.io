import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { load } from 'cheerio';
import { categoryFor } from './post-category.mjs';

const root = path.resolve('_site');
const categories = JSON.parse(await readFile('src/_data/categories.json', 'utf8'));
assert.equal(categories.length, 6);
assert.deepEqual(categories.map(c => c.name), ['개발', 'CTF/Wargame', 'Bug Bounty', '블로그/기술문서', '논문/컨퍼런스', '공모전/자격증']);
const migration = JSON.parse(await readFile('migration/report.json', 'utf8'));
const reviewed = JSON.parse(await readFile('migration/categories.json', 'utf8'));
for (const assignment of Object.values(reviewed.posts)) {
  assert(categories.some(category => category.id === assignment.category));
  assert(assignment.reason, 'Missing category review reason');
}
for (const [original, title, expected] of [
  ['Security/Crypto', '정수 모듈러 연산', 'writing'],
  ['Rust', 'Rust 소유권 설명', 'writing'],
  ['Security/Pwnable', 'GDB 사용법', 'writing'],
  ['Development/Web', 'CTF 사이트 개발일지', 'development'],
  ['Security/Pwnable', '[Dreamhack] example', 'ctf'],
  ['Security/Fuzzing', '[Fuzzing101] Exercise 3', 'ctf'],
  ['Security', 'CVE 취약점 원리 설명', 'writing'],
  ['', '버그 바운티 제보 후기', 'bug-bounty'],
  ['', 'WISA 논문 발표', 'research'],
  ['', '정보보안기사 합격 후기', 'achievements']
]) assert.equal(categoryFor(original, title), expected);
const signedCdnParameters = /(?:[?&]|&amp;)(?:credential|signature)=/i;
assert(!signedCdnParameters.test(await readFile('migration/report.json', 'utf8')), 'Signed CDN credentials in migration report');
assert.equal(migration.imported, migration.discovered, 'Some discovered posts were not imported');
assert.equal(migration.errors.filter(e => e.type === 'post').length, 0, 'Failed article import');
assert.equal(new Set(migration.posts.map(p => p.source)).size, migration.imported);
const search = JSON.parse(await readFile('_site/search.json', 'utf8'));
for (const post of migration.posts) {
  assert(categories.some(c => c.id === post.category));
  assert.equal(categoryFor(post.originalCategory, post.title, post.id), post.category, `Category review mismatch: ${post.id}`);
  const source = await readFile(`src/_posts/${post.date.slice(0, 10)}-tistory-${post.id}.html`, 'utf8');
  assert.equal(JSON.parse(source.match(/^category: (.*)$/m)[1]), post.category, `Source category mismatch: ${post.id}`);
  const html = await readFile(path.join(root, post.local, 'index.html'), 'utf8');
  assert(!signedCdnParameters.test(html), `Signed CDN credentials in post ${post.id}`);
  const page = load(html);
  const $ = load(page('template[data-document]').html() || '');
  assert.equal($('.article-header h1').text(), post.title);
  assert.equal(new Date($('.article-header time').attr('datetime')).toISOString(), new Date(post.date).toISOString());
  assert.equal($('.tistory-content img').length, post.images, `Image count changed in ${post.id}`);
  let originalText = $('.tistory-content').text();
  assert.equal(createHash('sha256').update(originalText).digest('hex'), post.importedTextSha256, `Imported text changed in ${post.id}`);
  for (const correction of [...(post.textCorrections || [])].reverse()) {
    assert(originalText.includes(correction.to), `Missing recorded correction in ${post.id}`);
    originalText = originalText.replaceAll(correction.to, correction.from);
  }
  const textHash = createHash('sha256').update(originalText).digest('hex');
  assert.equal(textHash, post.sourceTextSha256, `Body text changed in ${post.id}`);
  assert.equal($('.tistory-content script,.tistory-content iframe,.tistory-content form').length, 0);
  const result = search.find(item => item.url === post.local);
  assert(result && result.title === post.title && result.text, `Post missing from search: ${post.id}`);
  assert.equal(result.categoryId, post.category, `Search category mismatch: ${post.id}`);
  assert.equal(result.category, categories.find(c => c.id === post.category).name);
}
for (const category of categories) {
  const $ = load(await readFile(`_site/categories/${category.id}/index.html`, 'utf8'));
  const count = search.filter(p => p.category === category.name).length;
  assert.equal($('template[data-category]').attr('data-category'), category.id);
  assert.equal(Number($('template[data-category]').attr('data-count')), count);
}
const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (file.endsWith('.html')) htmlFiles.push(file);
  }
}
await walk(root);
const missing = [];
for (const file of htmlFiles) {
  const $ = load(await readFile(file, 'utf8'));
  assert.equal($('[data-terminal]').length, 1, `Missing CLI shell: ${file}`);
  assert.equal($('.header,.sidebar,.hero,.topic-card,.post-row,.search-dialog,.footer').length, 0, `Old blog interface: ${file}`);
  assert.equal($('link[rel="stylesheet"]').attr('href'), '/assets/terminal.css');
  const config = JSON.parse($('#shell-data').text());
  assert.deepEqual(config.categories, categories);
  const scopes = [$, ...$('template[data-document]').toArray().map(element => load($(element).html() || ''))];
  for (const scope of scopes) for (const element of scope('[href],[src]').toArray()) {
    const reference = scope(element).attr('href') || scope(element).attr('src');
    if (!reference?.startsWith('/') || reference.startsWith('//')) continue;
    const relative = decodeURIComponent(reference.split(/[?#]/)[0]);
    const target = path.resolve(root, '.' + relative);
    assert(target.startsWith(root + path.sep) || target === root, 'Link escaped output directory');
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(path.join(target, 'index.html'));
    } catch { missing.push({ file: path.relative(root, file), reference }); }
  }
}
assert.deepEqual(missing, [], 'Broken internal links or missing local assets');
assert.equal(load(await readFile('_site/feed.xml', 'utf8'), { xml: true })('feed entry').length, Math.min(30, search.length));
assert.equal(load(await readFile('_site/sitemap.xml', 'utf8'), { xml: true })('url').length, search.length + 8);
console.log(`PASS: ${migration.imported} articles retain their titles, dates, body text and image counts, allowing recorded corrections.`);
console.log(`PASS: 6 categories, ${htmlFiles.length} CLI-only HTML pages, all internal links, local assets, search, Atom feed and sitemap.`);
if (migration.errors.length) console.log(`NOTE: ${migration.errors.length} remote images returned errors during migration; see migration/README.md.`);
await import('./check-terminal.mjs');
