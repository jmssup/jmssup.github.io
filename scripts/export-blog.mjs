import { mkdtempSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [engine, vault] = process.argv.slice(2).map(arg => path.resolve(arg));
const requireQuartz = createRequire(path.join(engine, 'package.json'));
const { unified } = await import(pathToFileURL(requireQuartz.resolve('unified')));
const { default: remarkParse } = await import(pathToFileURL(requireQuartz.resolve('remark-parse')));
const { slugifyFilePath, slugHeading } = await import(pathToFileURL(path.join(engine, 'node_modules/@quartz-community/utils/dist/path.js')));
const { load: parseYaml, JSON_SCHEMA } = requireQuartz('js-yaml');
const markdown = unified().use(remarkParse);
const blog = '40 Blog/';
const attachments = '90 Attachments/Blog/';
const extension = /\.(?:png|jpe?g|gif|webp|avif|svg|pdf|mp[34]|webm|wav)$/i;
const wiki = /(!?)\[\[([^\n]*?)\]\](?!\])/g;
const blockId = /(?:^|\s)\^([a-zA-Z0-9-]+)[ \t]*$/;
const pathKey = value => value.normalize('NFC');
const plain = node => node.value ?? node.children?.map(plain).join('') ?? '';
const escapeLabel = value => value.replace(/[\\\[\]<>|*_]/g, '\\$&');
const files = new Map();
const short = new Map();
const notes = new Map();
const sources = new Map();
const assets = new Map();
const picked = new Map();
const ignoredLinks = new Set();

function scan(dir = '') {
  for (const entry of readdirSync(path.join(vault, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const name = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) scan(name);
    if (!entry.isFile()) continue;
    const key = pathKey(name);
    if (files.has(key)) throw new Error('Duplicate Vault path: ' + key);
    files.set(key, name);
    const base = path.posix.basename(key);
    short.set(base, short.has(base) ? null : key);
  }
}

function resolveFile(mention, from, allowShort = true) {
  const name = pathKey(mention);
  const locations = name.startsWith('/') ? [name.slice(1)] : name.startsWith('.')
    ? [path.posix.join(path.posix.dirname(from), name)]
    : [name, path.posix.join(path.posix.dirname(from), name)];
  for (const candidate of locations) {
    if (files.has(candidate)) return candidate;
    if (files.has(candidate + '.md')) return candidate + '.md';
  }
  if (allowShort && !name.includes('/')) return short.get(name) || short.get(name + '.md');
}

function readNote(name) {
  const raw = readFileSync(path.join(vault, files.get(name)), 'utf8').replace(/\r\n/g, '\n');
  const header = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(raw);
  if (!header) return { meta: {}, body: raw };
  return { meta: parseYaml(header[1], { schema: JSON_SCHEMA }) ?? {}, body: raw.slice(header[0].length) };
}

function linkedNote(value, from) {
  const match = typeof value === 'string' && /^\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]$/.exec(value);
  if (!match) throw new Error(from + ': publish 속성에 노트 위키링크가 필요합니다.');
  const target = resolveFile(match[1], from);
  if (!target?.endsWith('.md')) throw new Error(from + ': publish 링크를 찾을 수 없습니다.');
  return target;
}

function decode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function quartzLink(target) {
  // Normalize once before Markdown encoding so Quartz resolves commas and folder notes correctly.
  const suffix = target.endsWith('.md') ? '.md' : '';
  return encodeURI(slugifyFilePath(target) + suffix);
}

function outputNote(name) {
  // Preserve the old /about/ address as a directory page.
  return name === blog + 'about.md' ? 'about/index.md' : name.slice(blog.length);
}

function visit(node, fn) {
  fn(node);
  for (const child of node.children ?? []) visit(child, fn);
}

function editsToText(body, edits) {
  for (const { start, end, value } of edits.sort((a, b) => b.start - a.start)) {
    body = body.slice(0, start) + value + body.slice(end);
  }
  return body;
}

function offset(node) {
  return [node.position.start.offset, node.position.end.offset];
}

function removeComments(body) {
  const protectedRanges = [];
  visit(markdown.parse(body), node => {
    if (node.type === 'code' || node.type === 'inlineCode') protectedRanges.push(offset(node));
  });
  const edits = [];
  for (const match of body.matchAll(/%%/g)) {
    if (protectedRanges.some(([start, end]) => match.index >= start && match.index < end) && !edits.at(-1)?.open) continue;
    if (edits.at(-1)?.open) {
      edits.at(-1).end = match.index + 2;
      edits.at(-1).open = false;
    } else {
      edits.push({ start: match.index, end: body.length, value: '', open: true });
    }
  }
  return editsToText(body, edits);
}

function selectSection(body, fragment, from) {
  if (!fragment) return body;
  const nodes = markdown.parse(body).children;
  if (fragment[0] === '^') {
    const matches = [];
    for (const [index, node] of nodes.entries()) {
      if (node.type === 'code') continue;
      const [start, end] = offset(node);
      const value = body.slice(start, end);
      if (blockId.exec(value)?.[1] !== fragment.slice(1)) continue;
      const preceding = value.replace(blockId, '').trimEnd();
      matches.push(preceding || (index ? body.slice(...offset(nodes[index - 1])) : ''));
    }
    if (matches.length === 1 && matches[0]) return matches[0];
  } else {
    const titles = fragment.split('#').map(heading => pathKey(heading.trim()));
    const stack = [];
    const matches = [];
    for (const [index, node] of nodes.entries()) {
      if (node.type !== 'heading') continue;
      while (stack.at(-1)?.depth >= node.depth) stack.pop();
      stack.push({ depth: node.depth, title: pathKey(plain(node).trim()) });
      if (stack.slice(-titles.length).map(part => part.title).join('#') === titles.join('#')) matches.push(index);
    }
    if (matches.length === 1) {
      const index = matches[0];
      const next = nodes.slice(index + 1).find(node => node.type === 'heading' && node.depth <= nodes[index].depth);
      return body.slice(offset(nodes[index])[0], next ? offset(next)[0] : body.length);
    }
  }
  throw new Error(from + ': 절 또는 블록을 하나로 특정할 수 없습니다: ' + fragment);
}

function assetLink(target, page) {
  if (!target.startsWith(attachments) || !extension.test(target)) {
    throw new Error(page + ': 첨부는 ' + attachments + ' 아래에 두세요: ' + target);
  }
  const output = 'media/' + target.slice(attachments.length);
  assets.set(target, output);
  return quartzLink(output);
}

function exportTarget(mention, fragment, label, embed, from, page) {
  const target = mention ? resolveFile(mention, from) : from;
  if (target && !target.endsWith('.md')) {
    const url = assetLink(target, page);
    return (embed && !/\.(?:pdf|mp[34]|webm|wav)$/i.test(target) ? '!' : '') +
      '[' + escapeLabel(label || path.posix.basename(target)) + '](' + url + (fragment ? '#' + encodeURIComponent(fragment) : '') + ')';
  }
  if (embed) {
    if (target !== notes.get(page)?.source) {
      throw new Error(page + ': 본문 임베드는 양방향 publish 링크로 지정한 원문만 사용할 수 있습니다: ' + mention);
    }
    return '\n\n' + render(selectSection(removeComments(sources.get(target).body), fragment, target), target, page).trim() + '\n\n';
  }
  const publicPage = notes.has(target) ? target : picked.get(target);
  const display = escapeLabel(label || path.posix.basename((mention || fragment).replace(/\.md$/, '')));
  if (!publicPage) {
    ignoredLinks.add(from + ' -> ' + mention);
    return display;
  }
  const anchor = fragment ? '#' + encodeURI(slugHeading(fragment.split('#').at(-1))) : '';
  const url = (!mention && publicPage === page ? '' : quartzLink(outputNote(publicPage))) + anchor;
  return '[' + display + '](' + url + ')';
}

function render(body, from, page, allowEmbed = false) {
  const edits = [];
  const protectedRanges = [];
  visit(markdown.parse(body), node => {
    if (['code', 'inlineCode', 'html', 'link', 'image', 'definition'].includes(node.type)) {
      const [start, end] = offset(node);
      protectedRanges.push([start, end]);
      if (!['link', 'image', 'definition'].includes(node.type) || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(node.url)) return;
      if (node.type === 'definition') throw new Error(from + ': 로컬 참고 링크를 인라인 링크로 작성하세요: ' + node.url);
      if (node.type === 'link' && !node.url) return;
      const separator = node.url.indexOf('#');
      const mention = decode(separator < 0 ? node.url : node.url.slice(0, separator));
      const fragment = separator < 0 ? '' : decode(node.url.slice(separator + 1));
      if (node.type === 'image' && !resolveFile(mention, from)) throw new Error(from + ': 이미지를 찾을 수 없습니다: ' + mention);
      edits.push({ start, end, value: exportTarget(mention, fragment, node.alt ?? plain(node), node.type === 'image', from, page) });
    }
  });
  for (const match of body.matchAll(wiki)) {
    const start = match.index;
    const end = start + match[0].length;
    if (protectedRanges.some(([a, b]) => start < b && end > a)) continue;
    const [target, ...labels] = match[2].replace(/\\\|/g, '|').split('|');
    const [mention, ...fragments] = target.trim().split('#');
    if (match[1] && !allowEmbed && !extension.test(mention)) {
      throw new Error(from + ': 원문에 중첩된 노트 임베드는 공개본으로 옮겨 주세요: ' + mention);
    }
    const value = exportTarget(mention, fragments.join('#'), labels.join('|'), Boolean(match[1]), from, page);
    edits.push({ start, end, value });
  }
  for (const match of body.matchAll(/(?:^[ \t]*|\s+)\^[a-zA-Z0-9-]+[ \t]*$/gm)) {
    if (protectedRanges.some(([a, b]) => match.index >= a && match.index < b)) continue;
    edits.push({ start: match.index, end: match.index + match[0].length, value: '' });
  }
  return editsToText(body, edits);
}

scan();
for (const name of [...files.keys()].sort()) {
  if (!name.startsWith(blog) || !name.endsWith('.md')) continue;
  const note = readNote(name);
  if (note.meta.status !== 'complete') continue;
  notes.set(name, note);
  if (!note.meta.publish) continue;
  const source = linkedNote(note.meta.publish, name);
  if (!/^(00 Inbox|10 Projects|20 Knowledge|30 Courses)\//.test(source)) {
    throw new Error(name + ': 원문은 Inbox·Projects·Knowledge·Courses에 있어야 합니다.');
  }
  const original = readNote(source);
  if (linkedNote(original.meta.publish, source) !== name) throw new Error(name + ': 원문과 공개본의 publish 링크가 일치하지 않습니다.');
  if (sources.has(source)) throw new Error(name + ': 이 원문은 다른 공개본에 연결되어 있습니다.');
  sources.set(source, original);
  picked.set(source, name);
  note.source = source;
}
if (!notes.has(blog + 'index.md')) throw new Error('40 Blog/index.md가 없거나 status가 complete가 아닙니다.');
const slugs = new Set();
for (const name of notes.keys()) {
  const slug = quartzLink(outputNote(name));
  if (slugs.has(slug)) throw new Error('Quartz 주소가 겹칩니다: ' + name);
  slugs.add(slug);
}

const output = path.resolve('content');
const temporary = mkdtempSync(path.resolve('.cache', 'blog-export-'));
const staged = path.join(temporary, 'content');
function write(name, data) {
  const file = path.join(staged, name);
  mkdirSync(path.dirname(file), { recursive: true });
  if (data === undefined) return file;
  writeFileSync(file, data);
}

try {
  for (const [name, note] of notes) {
    const body = render(removeComments(note.body), name, name, true).trim();
    const first = markdown.parse(body).children[0];
    const title = first?.type === 'heading' && first.depth === 1 ? plain(first) : path.posix.basename(name, '.md');
    const article = first?.type === 'heading' && first.depth === 1 ? body.slice(offset(first)[1]).trimStart() : body;
    const date = String(note.meta.created ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(name + ': created 날짜는 YYYY-MM-DD여야 합니다.');
    write(outputNote(name), '---\ntitle: ' + JSON.stringify(title) + '\ndate: ' + JSON.stringify(date) + '\n---\n\n' + article + '\n');
  }
  for (const [source, destination] of assets) copyFileSync(path.join(vault, files.get(source)), write(destination));

  // Build a complete snapshot before replacing the previous one.
  const backup = path.join(temporary, 'previous-content');
  let moved = false;
  try { renameSync(output, backup); moved = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { renameSync(staged, output); } catch (error) { if (moved) renameSync(backup, output); throw error; }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
console.log('Exported ' + notes.size + ' public notes and ' + assets.size + ' attachments to content/.');
if (ignoredLinks.size) console.log('Rendered ' + ignoredLinks.size + ' links without a public target as plain text.');
