import { load } from 'cheerio';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripCdnCredentials } from './public-url.mjs';

const origin = 'https://myinfosub.tistory.com';
const cache = '.cache/tistory';
const output = 'src/_posts';
const assets = 'src/assets/tistory';
const reportPath = 'migration/report.json';
const refresh = process.argv.includes('--refresh');
const exists = async p => access(p).then(() => true, () => false);
const postFile = (id, date) => `${output}/${date.slice(0, 10)}-tistory-${id}.html`;
await Promise.all([cache, output, assets, 'migration'].map(p => mkdir(p, { recursive: true })));
const previous = await readFile(reportPath, 'utf8').then(JSON.parse, () => ({ posts: [] }));
const report = { source: origin, importedAt: new Date().toISOString(), posts: [], errors: refresh ? [] : [...(previous.errors || [])], assets: refresh ? [] : [...(previous.assets || [])] };
const assetDownloads = new Map();
const links = new Map();

async function download(url, destination) {
  if (!refresh && await exists(destination)) return readFile(destination);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'jmssup-blog-migration/1.0 (personal archive)' } });
      if (!response.ok) {
        if ([403, 404, 410].includes(response.status)) return Promise.reject(new Error(`${url}: HTTP ${response.status}`));
        throw new Error(`HTTP ${response.status}`);
      }
      const body = Buffer.from(await response.arrayBuffer());
      await writeFile(destination, body);
      return body;
    } catch (error) { lastError = error; }
  }
  throw new Error(`${url}: ${lastError.message}`);
}

function categoryFor(original, title) {
  if (/bounty|버그.?바운티/i.test(original)) return 'bug-bounty';
  if (/Development|Rust|인공지능|알고리즘|자료구조|컴파일러|모각코/i.test(original)) return 'development';
  if (/CTF|wargame|pwnable|Reversing|Crypto|Forensic|dreamhack|pwn\.college|Fuzzing101/i.test(original + ' ' + title)) return 'ctf';
  if (/논문|컨퍼런스|ICCE|WISA|학회/i.test(original)) return 'research';
  if (/공모전|자격증|수상/i.test(original)) return 'achievements';
  if (/Development|Rust|인공지능|알고리즘|자료구조|컴파일러|모각코|Security\/(System|Web|Blockchain|Fuzzing)/i.test(original)) return 'development';
  return 'writing';
}

async function localAsset(url) {
  if (assetDownloads.has(url)) return assetDownloads.get(url);
  const task = (async () => {
    const parsed = new URL(url);
    let extension = path.extname(parsed.pathname).toLowerCase();
    if (!/^\.[a-z0-9]{1,5}$/.test(extension)) extension = '.bin';
    const name = createHash('sha256').update(url).digest('hex').slice(0, 20) + extension;
    const destination = path.join(assets, name);
    try {
      const buffer = await download(url, destination);
      if (!buffer.length || buffer.subarray(0, 40).toString().match(/<!doctype html|<html/i)) throw new Error('Expected media, received HTML');
      report.assets.push({ source: url, local: `/assets/tistory/${name}`, bytes: buffer.length });
      return `/assets/tistory/${name}`;
    } catch (error) {
      report.errors.push({ type: 'asset', url, error: error.message });
      return url;
    }
  })();
  assetDownloads.set(url, task);
  return task;
}

const sitemap = (await download(`${origin}/sitemap.xml`, `${cache}/sitemap.xml`)).toString();
const xml = load(sitemap, { xml: true });
const urls = [...new Set(xml('loc').map((_, e) => xml(e).text()).get().filter(url => /^https:\/\/myinfosub\.tistory\.com\/\d+$/.test(url)))];
console.log(`Found ${urls.length} public posts.`);

async function importPost(url) {
  const id = new URL(url).pathname.slice(1);
  const old = previous.posts.find(post => post.id === id);
  if (!refresh && old && await exists(postFile(id, old.date))) {
    report.posts.push(old); links.set(url, `/posts/tistory/${id}/`); return;
  }
  try {
    const html = (await download(url, `${cache}/${id}.html`)).toString();
    const $ = load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('.hgroup h1').first().text().trim();
    const date = $('meta[property="article:published_time"]').attr('content');
    const originalCategory = $('.hgroup .category').first().text().trim();
    const body = $('.contents_style').first();
    if (!title || !date || !body.length || !body.text().trim()) throw new Error('Missing title/date/article body');
    const target = postFile(id, date);
    if (!refresh && await exists(target)) throw new Error(`${target} exists without a matching migration record; refusing to overwrite`);
    const originalTextHash = createHash('sha256').update(body.text()).digest('hex');
    const imageCount = body.find('img').length;
    body.find('script,style,iframe,object,embed,form').remove();
    body.find('*').each((_, element) => {
      for (const name of Object.keys(element.attribs || {})) {
        if (/^on/i.test(name) || name === 'srcdoc') $(element).removeAttr(name);
      }
    });
    for (const element of body.find('[src],a[href]').toArray()) {
      const node = $(element);
      const attribute = node.is('a') ? 'href' : 'src';
      let reference = node.attr(attribute);
      if (!reference || reference.startsWith('#')) continue;
      const absolute = new URL(reference, url);
      if (!['https:', 'http:', 'mailto:'].includes(absolute.protocol)) { node.removeAttr(attribute); continue; }
      if ((attribute === 'src' || node.closest('figure.fileblock').length) && /(^|\.)(daumcdn\.net|kakaocdn\.net|tistory\.com)$/.test(absolute.hostname)) {
        reference = await localAsset(absolute.href);
      } else reference = absolute.href;
      node.attr(attribute, reference);
      node.removeAttr('srcset');
      if (node.is('img')) {
        node.attr('loading', 'lazy').attr('decoding', 'async');
        if (!node.attr('alt')) node.attr('alt', node.closest('figure').find('figcaption').text().trim() || `${title}의 참고 이미지`);
      }
    }
    const textCorrections = previous.posts.find(post => post.id === id)?.textCorrections || [];
    let importedHtml = body.html();
    for (const correction of textCorrections) importedHtml = importedHtml.replaceAll(correction.from, correction.to);
    const migrated = load(importedHtml);
    const category = categoryFor(originalCategory, title);
    const description = migrated.root().text().replace(/\s+/g, ' ').trim().slice(0, 155);
    const metadata = { title, date, category, originalCategory, source: url, description, layout: 'post', tags: ['post'], permalink: `/posts/tistory/${id}/`, render_with_liquid: false };
    const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    await writeFile(target, stripCdnCredentials(`---\n${frontmatter}\n---\n<div class="tistory-content">${importedHtml}</div>\n`));
    report.posts.push({ id, title, source: url, local: metadata.permalink, date, category, originalCategory, images: imageCount, sourceTextSha256: originalTextHash, importedTextSha256: createHash('sha256').update(migrated.root().text()).digest('hex'), ...(textCorrections.length ? { textCorrections } : {}) });
    links.set(url, metadata.permalink);
    console.log(`[${report.posts.length}/${urls.length}] ${id} ${title}`);
  } catch (error) { report.errors.push({ type: 'post', url, error: error.message }); }
}

let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < urls.length) await importPost(urls[cursor++]);
}));
for (const post of report.posts) {
  const filename = postFile(post.id, post.date);
  let text = await readFile(filename, 'utf8');
  text = text.replace(/href="https:\/\/myinfosub\.tistory\.com\/(\d+)(?:\?[^"#]*)?(#[^"]*)?"/g, (match, id, hash = '') => links.has(`${origin}/${id}`) ? `href="${links.get(`${origin}/${id}`)}${hash}"` : match);
  await writeFile(filename, stripCdnCredentials(text));
}
report.discovered = urls.length;
report.imported = report.posts.length;
report.posts.sort((a, b) => Number(a.id) - Number(b.id));
await writeFile(reportPath, stripCdnCredentials(JSON.stringify(report, null, 2)) + '\n');
console.log(`Imported ${report.imported}/${report.discovered}; ${report.errors.length} errors. See ${reportPath}`);
if (report.errors.length || report.imported !== report.discovered) process.exitCode = 1;
