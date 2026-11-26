import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { load } from 'cheerio';
import { categoryFor } from './post-category.mjs';

const root = path.resolve('_site');
const categories = JSON.parse(await readFile('src/_data/categories.json', 'utf8'));
const topics = categories.filter(category => !category.id.includes('/'));
assert.deepEqual(topics.map(c => c.name), ['컴퓨터과학', '보안', '개발', '인공지능', '모각코', '문제 해결']);
assert.equal(new Set(categories.map(c => c.id)).size, categories.length);
for (const category of categories) {
  assert.match(category.id, /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/);
  const ancestors = category.id.split('/').map((_, index, parts) => categories.find(c => c.id === parts.slice(0,index+1).join('/')));
  assert(ancestors.every(Boolean), `Missing parent category: ${category.id}`);
  assert.equal(category.label, ancestors.map(c => c.name).join(' / '));
}
const migration = JSON.parse(await readFile('migration/report.json', 'utf8'));
const reviewed = JSON.parse(await readFile('migration/categories.json', 'utf8'));
for (const assignment of Object.values(reviewed.posts)) {
  assert(categories.some(category => category.id === assignment.category));
  assert(assignment.reason, 'Missing category review reason');
  const category = categories.find(c => c.id === assignment.category);
  assert(assignment.vaultNote.startsWith(`40 Blog/${category.vaultPath}/`));
}
for (const [original, title, expected] of [
  ['Security/Crypto', '정수 모듈러 연산', 'security/crypto'],
  ['Rust', 'Rust 소유권 설명', 'development/rust'],
  ['Security/Pwnable', 'GDB 사용법', 'security/pwnable'],
  ['Development/Web', 'CTF 사이트 개발일지', 'development/web'],
  ['Security/Fuzzing', '[Fuzzing101] Exercise 3', 'security/fuzzing'],
  ['Security', 'CVE 취약점 원리 설명', 'security'],
  ['알고리즘', '정렬', 'cs/algorithms'],
  ['모각코/2026 하계 모각코', '학습 기록', 'study-logs/2026-summer'],
  ['AI/Diffusion', 'CFG', 'ai/diffusion']
]) assert.equal(categoryFor(original, title), expected);
assert.throws(() => categoryFor('', '분류가 필요한 새 글'), /분류를 검토/);
const signedCdnParameters = /(?:[?&]|&amp;)(?:credential|signature)=/i;
assert(!signedCdnParameters.test(await readFile('migration/report.json', 'utf8')), 'Signed CDN credentials in migration report');
assert.equal(migration.imported, migration.discovered, 'Some discovered posts were not imported');
assert.equal(migration.errors.filter(e => e.type === 'post').length, 0, 'Failed article import');
assert.equal(new Set(migration.posts.map(p => p.source)).size, migration.imported);
const search = JSON.parse(await readFile('_site/search.json', 'utf8'));
assert.equal(search.length, migration.imported);
assert.equal(Object.keys(reviewed.posts).length, migration.imported);
assert.deepEqual(topics.map(c => search.filter(p => p.categoryId === c.id || p.categoryId.startsWith(c.id + '/')).length), [19,52,24,13,28,3]);
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
  assert.equal(result.category, categories.find(c => c.id === post.category).label);
}
for (const category of categories) {
  const $ = load(await readFile(`_site/categories/${category.id}/index.html`, 'utf8'));
  const count = search.filter(p => p.categoryId === category.id || p.categoryId.startsWith(category.id + '/')).length;
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
assert.equal(htmlFiles.length, search.length + categories.length + 3, 'Missing or stale generated pages');
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
assert.equal(load(await readFile('_site/sitemap.xml', 'utf8'), { xml: true })('url').length, search.length + categories.length + 2);
console.log(`PASS: ${migration.imported} articles retain their titles, dates, body text and image counts, allowing recorded corrections.`);
console.log(`PASS: ${topics.length} topics, ${categories.length} category directories, ${htmlFiles.length} CLI-only HTML pages, all internal links, local assets, search, Atom feed and sitemap.`);
if (migration.errors.length) console.log(`NOTE: ${migration.errors.length} remote images returned errors during migration; see migration/README.md.`);
await import('./check-terminal.mjs');
