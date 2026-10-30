const commands = ['help', 'ls', 'cd', 'pwd', 'cat', 'grep', 'open', 'about', 'links', 'whoami', 'history', 'clear'];

export function parseCommand(line) {
  const words = [];
  let word = '', quote = '', started = false;
  for (const char of line.trim()) {
    if (quote) {
      if (char === quote) quote = '';
      else word += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) { words.push(word); word = ''; started = false; }
    } else { word += char; started = true; }
  }
  if (quote) throw new Error('따옴표를 닫아 주세요. 예: grep "OP-TEE"');
  if (started) words.push(word);
  return words;
}

export function resolvePath(value, cwd = '/') {
  const path = value === '~' || value.startsWith('~/') ? value.replace(/^~/, '/') : value;
  const parts = path.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return '/' + parts.join('/');
}

export function createFilesystem(posts, categories, profile = {}) {
  const directories = new Map(categories.map(category => [category.id, category.name]));
  const files = new Map();
  for (const post of posts) {
    if (!directories.has(post.categoryId) || !post.url.startsWith('/posts/')) throw new Error('글 목록의 경로를 확인해 주세요.');
    const name = post.url.replace(/^\/posts\//, '').replace(/\/$/, '').replaceAll('/', '-') + '.md';
    const path = `/${post.categoryId}/${name}`;
    if (files.has(path)) throw new Error(`중복된 글 경로: ${path}`);
    files.set(path, { ...post, name, path });
  }
  const documents = new Map([['/about.txt', { path: '/about.txt', name: 'about.txt', title: '정명섭 — 소개', url: '/about/' }]]);
  return { directories, files, documents, profile, cwd: '/', previous: '/', history: [] };
}

export function routeForPath(pathname, state) {
  const normalize = value => {
    try { return decodeURI(new URL(value, 'https://ssup.invalid').pathname).replace(/\/$/, '') || '/'; }
    catch { return value; }
  };
  const path = normalize(pathname);
  if (path === '/') return { cwd: '/', command: 'ls' };
  for (const file of [...state.files.values(), ...state.documents.values()]) {
    if (normalize(file.url) === path) return { cwd: file.categoryId ? '/' + file.categoryId : '/', command: `open ${file.path}` };
  }
  const category = path.match(/^\/categories\/([^/]+)$/)?.[1];
  if (state.directories.has(category)) return { cwd: '/' + category, command: 'ls' };
  return null;
}

export function completeCommand(line, state) {
  const boundary = line.lastIndexOf(' ') + 1;
  const prefix = line.slice(0, boundary), token = line.slice(boundary);
  let candidates;
  if (!boundary) candidates = commands.filter(command => command.startsWith(token));
  else {
    const slash = token.lastIndexOf('/') + 1;
    const parent = resolvePath(token.slice(0, slash) || '.', state.cwd);
    const fragment = token.slice(slash);
    const names = parent === '/' ? [...state.directories.keys()].map(id => id + '/') : [];
    if (line.split(' ')[0] !== 'cd') {
      for (const file of state.files.values()) if (file.path.slice(0, file.path.lastIndexOf('/')) === parent) names.push(file.name);
      if (parent === '/') names.push(...[...state.documents.values()].map(file => file.name));
    }
    candidates = names.filter(name => name.startsWith(fragment)).map(name => token.slice(0, slash) + name);
  }
  if (!candidates.length) return { value: line, candidates };
  let common = candidates[0];
  while (!candidates.every(candidate => candidate.startsWith(common))) common = common.slice(0, -1);
  return { value: prefix + common + (candidates.length === 1 && !common.endsWith('/') ? ' ' : ''), candidates };
}

export function runCommand(line, state) {
  const [command, ...args] = parseCommand(line);
  const lines = [];
  const say = (text, kind = '') => lines.push({ text, kind });
  const path = resolvePath(args[0] || '.', state.cwd);
  const isDirectory = value => value === '/' || state.directories.has(value.slice(1));
  const fileRows = files => {
    for (const file of files) lines.push({ text: file.path.slice(1), detail: file.title, command: `open ${file.path}` });
  };
  const fileAt = value => {
    const file = state.files.get(value) || state.documents.get(value);
    if (!file) throw new Error(`${value}: ${isDirectory(value) ? '디렉터리입니다. ls로 목록을 확인하세요.' : '파일을 찾을 수 없습니다. ls 또는 Tab으로 경로를 확인하세요.'}`);
    return file;
  };
  switch (command) {
    case undefined: break;
    case 'help':
      say('블로그의 6개 카테고리는 디렉터리, 글은 .md 파일입니다.', 'heading');
      say('ls [경로]           카테고리 또는 글 목록\ncd [경로]           디렉터리 이동 (.., ~, - 지원)\npwd                 현재 경로\ncat <파일>          본문을 텍스트로 출력\nopen <파일>         이미지·코드 서식을 포함해 터미널에서 읽기\ngrep <검색어> [경로] 글 제목·본문 검색 (따옴표 사용 가능)\nabout               블로그 주인 소개\nlinks               GitHub · Tistory · RSS\nwhoami              현재 사용자\nhistory             이번 방문의 명령 기록\nclear               터미널 화면 비우기');
      lines.push({ text: '시작하기 → ls development', command: 'ls development' });
      break;
    case 'pwd': say(state.cwd); break;
    case 'ls': {
      const target = resolvePath(args.find(arg => !['-l', '-a', '-la', '-al'].includes(arg)) || '.', state.cwd);
      if (state.files.has(target) || state.documents.has(target)) fileRows([fileAt(target)]);
      else if (!isDirectory(target)) throw new Error(`${target}: 디렉터리를 찾을 수 없습니다.`);
      else if (target === '/') {
        for (const [id, name] of state.directories) {
          const count = [...state.files.values()].filter(file => file.categoryId === id).length;
          lines.push({ text: `${id}/`, detail: `${name} · ${count}개의 기록`, command: `ls /${id}` });
        }
        fileRows(state.documents.values());
      } else {
        const files = [...state.files.values()].filter(file => file.categoryId === target.slice(1));
        fileRows(files);
        if (!files.length) say('이 디렉터리에는 아직 기록이 없습니다.', 'muted');
      }
      break;
    }
    case 'cd': {
      if (args.length > 1) throw new Error('사용법: cd [디렉터리]');
      const target = args[0] === '-' ? state.previous : resolvePath(args[0] || '/', state.cwd);
      if (!isDirectory(target)) throw new Error(`${target}: 디렉터리를 찾을 수 없습니다.`);
      state.previous = state.cwd;
      state.cwd = target;
      return { lines, location: target === '/' ? '/' : `/categories${target}/` };
    }
    case 'cat':
    case 'open': {
      if (args.length !== 1) throw new Error(`사용법: ${command} <파일 경로>`);
      const file = fileAt(path);
      say(file.title, 'heading');
      if (file.date) say(`${file.date} · ${file.category}`, 'muted');
      if (command === 'cat') lines.push({ text: `open ${file.path}  ← 이미지·서식 포함`, command: `open ${file.path}` });
      return { read: file, mode: command === 'cat' ? 'text' : 'rich', lines, ...(command === 'open' ? { location: file.url } : {}) };
    }
    case 'grep': {
      if (!args[0] || args.length > 2) throw new Error('사용법: grep <검색어> [경로] — 띄어쓰기는 따옴표로 묶어 주세요.');
      const scope = args[1] ? resolvePath(args[1], state.cwd) : state.cwd;
      if (!isDirectory(scope) && !state.files.has(scope)) throw new Error(`${scope}: 경로를 찾을 수 없습니다.`);
      const query = args[0].toLocaleLowerCase();
      const found = [...state.files.values()].filter(file => (scope === '/' || file.path === scope || file.path.startsWith(scope + '/')) && `${file.title} ${file.text}`.toLocaleLowerCase().includes(query));
      say(`${found.length}개의 기록을 찾았습니다.${found.length > 50 ? ' 처음 50개를 표시합니다. 디렉터리로 범위를 좁혀 보세요.' : ''}`, 'muted');
      fileRows(found.slice(0, 50));
      break;
    }
    case 'whoami':
      say('guest', 'heading');
      say('정명섭(ssup)의 공개 기록을 둘러보는 방문자입니다.');
      lines.push({ text: 'about  ← 블로그 주인 소개', command: 'about' });
      break;
    case 'about': return runCommand('open /about.txt', state);
    case 'links':
      for (const [label, href] of [['GitHub', state.profile.github], ['Tistory', state.profile.tistory], ['RSS', '/feed.xml']]) {
        if (href) lines.push({ text: `${label}  ${href}`, href });
      }
      break;
    case 'history': say(state.history.map((value, index) => `${String(index + 1).padStart(3)}  ${value}`).join('\n')); break;
    case 'clear': return { clear: true, lines };
    default: throw new Error(`${command}: command not found. help로 명령어를 확인해 주세요.`);
  }
  return { lines };
}

function articleText(article) {
  const copy = article.cloneNode(true);
  for (const element of copy.querySelectorAll('script,style,iframe,object,embed,form')) element.remove();
  for (const br of copy.querySelectorAll('br')) br.replaceWith('\n');
  for (const image of copy.querySelectorAll('img')) image.replaceWith(`\n[이미지${image.alt ? ': ' + image.alt : ''} — open 명령으로 확인]\n`);
  for (const block of copy.querySelectorAll('p,h1,h2,h3,h4,li,pre,blockquote,table,tr,figure')) block.append('\n\n');
  return copy.textContent.replace(/\n[\t \u00a0]*\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function articleView(article, url) {
  const copy = article.cloneNode(true);
  const tags = new Set('DIV SPAN P BR HR H1 H2 H3 H4 H5 H6 PRE CODE BLOCKQUOTE UL OL LI DL DT DD STRONG EM B I U S DEL INS SUB SUP KBD SAMP VAR MARK SMALL A IMG FIGURE FIGCAPTION TABLE THEAD TBODY TFOOT TR TD TH CAPTION COLGROUP COL DETAILS SUMMARY TIME SECTION HEADER'.split(' '));
  const attributes = new Set(['class', 'id', 'href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'start', 'open', 'datetime']);
  for (const element of copy.querySelectorAll('*')) {
    if (!tags.has(element.tagName)) { element.remove(); continue; }
    for (const attribute of [...element.attributes]) if (!attributes.has(attribute.name)) element.removeAttribute(attribute.name);
    for (const attribute of ['href', 'src']) {
      if (!element.hasAttribute(attribute)) continue;
      try {
        const value = new URL(element.getAttribute(attribute), new URL(url, location.origin));
        if (!['http:', 'https:'].includes(value.protocol) && !(attribute === 'href' && value.protocol === 'mailto:')) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value.href);
      } catch { element.removeAttribute(attribute); }
    }
    if (element.tagName === 'A') {
      element.rel = 'noopener';
      if (element.origin !== location.origin) element.target = '_blank';
    }
    if (element.tagName === 'PRE') { element.tabIndex = 0; element.setAttribute('aria-label', '코드 블록'); }
    if (element.tagName === 'IMG') {
      element.loading = 'lazy';
      element.addEventListener('error', () => {
        const fallback = document.createElement('p');
        fallback.className = 'image-unavailable';
        fallback.textContent = `[이미지를 불러올 수 없습니다${element.alt ? ': ' + element.alt : ''}]`;
        element.replaceWith(fallback);
      }, { once: true });
    }
  }
  return copy;
}

async function initTerminal(terminal) {
  const form = terminal.querySelector('[data-terminal-form]');
  const input = form.querySelector('input');
  const submit = form.querySelector('button');
  const output = terminal.querySelector('[data-terminal-output]');
  const screen = terminal.querySelector('[data-terminal-screen]');
  const cwd = terminal.querySelector('[data-terminal-cwd]');
  const status = terminal.querySelector('[data-terminal-status]');
  const sourcePath = location.pathname;
  const sourceDocument = document.querySelector('template[data-document]');
  const homeTitle = 'ssup — 정명섭의 기록';
  let state, position = 0, draft = '', busy = false, routeVersion = 0;
  function updatePrompt() { cwd.textContent = state.cwd === '/' ? '~' : '~' + state.cwd; }
  function renderLines(parent, lines) {
    for (const line of lines) {
      const element = document.createElement(line.command ? 'button' : line.href ? 'a' : 'div');
      element.className = line.command || line.href ? 'shell-item' : `shell-line ${line.kind || ''}`;
      if (line.command) { element.type = 'button'; element.dataset.terminalCommand = line.command; }
      if (line.href) { element.href = line.href; if (element.origin !== location.origin) { element.target = '_blank'; element.rel = 'noopener'; } }
      if (line.detail) {
        element.classList.add('shell-file');
        for (const text of [line.text, line.detail]) {
          const span = document.createElement('span');
          span.textContent = text;
          element.append(span);
        }
      } else element.textContent = line.text;
      parent.append(element);
    }
  }
  async function readArticle(file) {
    let template = new URL(file.url, location.origin).pathname === sourcePath ? sourceDocument : null;
    if (!template) {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('본문을 불러오지 못했습니다. 같은 명령으로 다시 시도해 주세요.');
      template = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('template[data-document]');
    }
    const article = template?.content.querySelector('.prose');
    if (!article) throw new Error('기록의 본문을 찾을 수 없습니다.');
    return article;
  }
  async function execute(line, { focus = true, writeURL = true } = {}) {
    if (busy || !state || !line.trim()) return;
    const version = routeVersion;
    busy = true;
    input.disabled = submit.disabled = true;
    const entry = document.createElement('div');
    entry.className = 'shell-entry';
    const echo = document.createElement('div');
    echo.className = 'shell-echo';
    const prompt = form.querySelector('label').cloneNode(true);
    prompt.removeAttribute('for');
    prompt.querySelector('[data-terminal-cwd]').removeAttribute('data-terminal-cwd');
    const typed = document.createElement('span');
    typed.className = 'shell-echo-command';
    typed.textContent = line;
    echo.append(prompt, typed);
    entry.append(echo);
    output.append(entry);
    if (state.history.at(-1) !== line) state.history.push(line);
    if (state.history.length > 100) state.history.shift();
    position = state.history.length;
    draft = input.value = '';
    try {
      const result = runCommand(line, state);
      if (result.clear) { output.replaceChildren(); terminal.querySelector('.shell-welcome').hidden = true; }
      else renderLines(entry, result.lines);
      if (result.read) {
        const body = document.createElement('div');
        body.className = `shell-article ${result.mode}`;
        body.textContent = '기록을 불러오는 중입니다…';
        entry.append(body);
        screen.scrollTop = screen.scrollHeight;
        const article = await readArticle(result.read);
        if (version !== routeVersion) { entry.remove(); return; }
        if (result.mode === 'rich') body.replaceChildren(articleView(article, result.read.url));
        else body.textContent = articleText(article);
        if (result.location) document.title = `${result.read.title} · ${homeTitle}`;
      } else if (result.location) document.title = homeTitle;
      if (result.location && writeURL && location.pathname !== result.location) history.pushState(null, '', result.location);
      status.textContent = `${line} 명령 완료. 출력 영역에서 결과를 확인할 수 있습니다.`;
    } catch (error) {
      entry.querySelector('.shell-article')?.remove();
      renderLines(entry, [{ text: error.message, kind: 'error' }]);
      status.textContent = error.message;
    } finally {
      updatePrompt();
      while (output.children.length > 40) output.firstElementChild.remove();
      busy = false;
      input.disabled = submit.disabled = false;
      if (version !== routeVersion) await restoreRoute();
      else {
        if (focus) input.focus({ preventScroll: true });
        if (entry.querySelector('.shell-article')) screen.scrollTop = entry.offsetTop - 12;
        else screen.scrollTop = screen.scrollHeight;
      }
    }
  }
  async function restoreRoute() {
    if (busy || !state) return;
    const route = routeForPath(location.pathname, state);
    state.previous = state.cwd;
    state.cwd = route?.cwd || '/';
    updatePrompt();
    if (route) await execute(route.command, { focus: false, writeURL: false });
    else {
      renderLines(output, [{ text: `404: ${location.pathname} — 기록을 찾을 수 없습니다.`, kind: 'error' }, { text: 'ls /  ← 처음부터 탐색', command: 'ls /' }]);
      status.textContent = '해당 주소의 기록을 찾을 수 없습니다.';
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); execute(input.value); });
  terminal.addEventListener('click', async event => {
    if (event.target.closest('[data-terminal-reload]')) { location.reload(); return; }
    const button = event.target.closest('[data-terminal-command]');
    if (button) { execute(button.dataset.terminalCommand); return; }
    const link = event.target.closest('a[href]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.origin !== location.origin || !state) return;
    const article = link.closest('.shell-article');
    const target = article && link.hash ? [...article.querySelectorAll('[id]')].find(element => element.id === decodeURIComponent(link.hash.slice(1))) : null;
    if (target) { event.preventDefault(); target.scrollIntoView({ block: 'nearest' }); return; }
    const route = routeForPath(link.pathname, state);
    if (route) {
      event.preventDefault();
      if (route.command === 'ls') { await execute(`cd ${route.cwd}`); await execute('ls'); }
      else await execute(route.command);
    }
  });
  window.addEventListener('popstate', () => { routeVersion++; restoreRoute(); });
  input.addEventListener('keydown', event => {
    if (event.isComposing || !state) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (position === state.history.length) draft = input.value;
      position = Math.max(0, Math.min(state.history.length, position + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = position === state.history.length ? draft : state.history[position];
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) {
      const completion = completeCommand(input.value, state);
      if (completion.value !== input.value || completion.candidates.length > 1) {
        event.preventDefault();
        input.value = completion.value;
        if (completion.candidates.length > 1) {
          renderLines(output, [{ text: completion.candidates.join('  '), kind: 'muted' }]);
          screen.scrollTop = screen.scrollHeight;
          status.textContent = `${completion.candidates.length}개의 자동완성 후보가 있습니다.`;
        }
      }
    } else if (event.key === 'Escape') input.blur();
    else if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); execute('clear'); }
    else if (event.ctrlKey && event.key.toLowerCase() === 'c') { event.preventDefault(); input.value = ''; }
  });
  try {
    const response = await fetch('/search.json');
    if (!response.ok) throw new Error();
    const config = JSON.parse(document.querySelector('#shell-data').textContent);
    state = createFilesystem(await response.json(), config.categories, config);
    input.disabled = submit.disabled = false;
    terminal.querySelector('[data-terminal-count]').textContent = `${state.directories.size} directories`;
    await restoreRoute();
    if (!matchMedia('(pointer: coarse)').matches) input.focus({ preventScroll: true });
  } catch {
    renderLines(output, [{ text: '글 목록을 불러오지 못했습니다. 새로고침해 다시 연결해 주세요.', kind: 'error' }]);
    const retry = document.createElement('button');
    retry.className = 'shell-item';
    retry.dataset.terminalReload = '';
    retry.textContent = 'retry  ← 다시 연결';
    output.append(retry);
    terminal.querySelector('[data-terminal-count]').textContent = 'offline';
    status.textContent = '터미널 글 목록을 불러오지 못했습니다.';
  }
}

if (typeof document !== 'undefined') {
  const terminal = document.querySelector('[data-terminal]');
  if (terminal) initTerminal(terminal);
}
