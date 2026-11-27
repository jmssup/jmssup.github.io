import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const site = 'https://jmssup.github.io';

export function legacyRoutes(index) {
  const { posts: assignments } = readJson('migration/categories.json');
  const { posts } = readJson('migration/report.json');
  const categories = readJson('src/_data/categories.json');
  const byFile = new Map();
  const bySource = new Map();
  for (const [slug, note] of Object.entries(index)) {
    const file = path.join('content', note.filePath);
    if (!existsSync(file)) continue;
    byFile.set(note.filePath.normalize('NFC'), slug);
    // A renamed Vault note can still be found by its original Tistory credit.
    const source = /^- \[Tistory 원문\]\((https:\/\/myinfosub\.tistory\.com\/\d+)\)[ \t]*$/m.exec(readFileSync(file, 'utf8'))?.[1];
    if (source) bySource.set(source, bySource.has(source) ? null : slug);
  }
  const routes = new Map();
  for (const { id, local, source } of posts) {
    const file = assignments[id]?.vaultNote.replace(/^40 Blog\//, '').normalize('NFC');
    const slug = byFile.get(file) ?? bySource.get(source);
    if (slug) routes.set(local, '/' + slug.split('/').map(encodeURIComponent).join('/') + '.html');
  }
  for (const { id } of categories) {
    if (Object.hasOwn(index, id + '/index')) routes.set('/categories/' + id + '/', '/' + id + '/');
  }
  return routes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const routes = legacyRoutes(readJson('_site/static/contentIndex.json'));
  for (const [from, to] of routes) {
    const file = path.join('_site', from, 'index.html');
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, [
      '<!doctype html>',
      '<html lang="ko"><meta charset="utf-8">',
      '<meta name="robots" content="noindex">',
      '<link rel="canonical" href="' + site + to + '">',
      '<meta http-equiv="refresh" content="0;url=' + to + '">',
      '<title>글 주소가 바뀌었습니다</title>',
      '<p><a href="' + to + '">글 열기</a></p></html>',
      '',
    ].join('\n'), { flag: 'wx' });
  }
  if (existsSync('_site/index.xml')) copyFileSync('_site/index.xml', '_site/feed.xml');
  console.log('Linked ' + routes.size + ' previous article and category URLs.');
}
