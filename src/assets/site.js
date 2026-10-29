const themeButton = document.querySelector('[data-theme-toggle]');
function updateThemeLabel() {
  themeButton.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환');
}
updateThemeLabel();
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('ssup-theme', theme); } catch {}
  updateThemeLabel();
});
document.querySelector('[data-menu-toggle]').addEventListener('click', event => {
  const open = document.querySelector('#sidebar').classList.toggle('is-open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
  event.currentTarget.setAttribute('aria-label', open ? '카테고리 메뉴 닫기' : '카테고리 메뉴 열기');
});
document.querySelector('[data-back-top]').addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

const list = document.querySelector('[data-filter-list]');
if (list) {
  const rows = [...list.querySelectorAll('[data-post-row]')];
  const more = document.querySelector('[data-load-more]');
  const filter = document.querySelector('#post-filter');
  let visible = 8;
  function renderList() {
    let count = 0;
    for (const row of rows) {
      const matches = filter.value === 'all' || row.querySelector('.category-label').getAttribute('href') === `/categories/${filter.value}/`;
      row.hidden = !matches || ++count > visible;
    }
    more.hidden = count <= visible;
    document.querySelector('.empty-filter').hidden = count !== 0;
  }
  more.addEventListener('click', () => { visible += 8; renderList(); });
  filter.addEventListener('change', () => { visible = 8; renderList(); });
  renderList();
}

const dialog = document.querySelector('.search-dialog');
const input = document.querySelector('#search-input');
const status = document.querySelector('.search-status');
const results = document.querySelector('.search-results');
let searchData;
async function openSearch() {
  if (!dialog.open) dialog.showModal();
  input.focus();
  if (!searchData) {
    status.textContent = '검색 목록을 불러오는 중입니다.';
    try {
      const response = await fetch('/search.json');
      if (!response.ok) throw new Error('검색 목록을 불러올 수 없습니다.');
      searchData = await response.json();
      search();
    } catch {
      status.textContent = '검색 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }
}
function search() {
  if (!searchData) return;
  const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  results.replaceChildren();
  if (!terms.length) { status.textContent = '검색어를 입력해 주세요.'; return; }
  const found = searchData.filter(post => terms.every(term => `${post.title} ${post.category} ${post.originalCategory} ${post.text}`.toLocaleLowerCase().includes(term)));
  status.textContent = `${found.length}개의 기록을 찾았습니다.${found.length > 50 ? ' 처음 50개를 표시합니다.' : ''}`;
  for (const post of found.slice(0, 50)) {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = post.url;
    for (const [tag, value] of [['span', `${post.category} · ${post.date}`], ['h3', post.title], ['p', post.description]]) {
      const element = document.createElement(tag);
      element.textContent = value;
      link.append(element);
    }
    results.append(link);
  }
}
input.addEventListener('input', search);
document.querySelector('[data-search-open]').addEventListener('click', openSearch);
document.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog && event.clientY < dialog.getBoundingClientRect().top) dialog.close(); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault();
    openSearch();
  }
});

for (const pre of document.querySelectorAll('.prose pre')) {
  pre.setAttribute('tabindex', '0');
  pre.setAttribute('aria-label', '코드 블록');
}

for (const image of document.querySelectorAll('.prose img')) {
  const showFallback = () => {
    if (image.nextElementSibling?.classList.contains('image-unavailable')) return;
    const fallback = document.createElement('p');
    fallback.className = 'image-unavailable';
    fallback.append('원본 이미지에 접근할 수 없습니다. ');
    const link = document.createElement('a');
    link.href = image.src;
    link.textContent = '이미지 주소 확인 ↗';
    fallback.append(link);
    image.hidden = true;
    image.after(fallback);
  };
  image.addEventListener('error', showFallback, { once: true });
  if (image.complete && !image.naturalWidth) showFallback();
}
