import { load } from 'cheerio';
import categories from './src/_data/categories.json' with { type: 'json' };

export default function (config) {
  config.addPassthroughCopy({ 'src/assets': 'assets' });
  config.addPassthroughCopy({ 'src/robots.txt': 'robots.txt' });
  config.addCollection('posts', api => api.getFilteredByTag('post').sort((a, b) => b.date - a.date));
  config.addFilter('dateLabel', value => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).format(new Date(value)).replace(/\. /g, '.').replace(/\.$/, ''));
  config.addFilter('isoDate', value => new Date(value).toISOString());
  config.addFilter('category', id => categories.find(c => c.id === id));
  config.addFilter('inCategory', (posts, id) => (posts || []).filter(post => post.data.category === id));
  config.addFilter('limit', (posts, count) => posts.slice(0, count));
  config.addFilter('readingTime', content => Math.max(1, Math.ceil(load(content || '').text().length / 650)));
  config.addFilter('plain', content => load(content || '').text().replace(/\s+/g, ' ').trim());
  config.addFilter('absolute', url => new URL(url, 'https://jmssup.github.io').href);
  config.addFilter('json', value => JSON.stringify(value).replace(/</g, '\\u003c'));
  config.addFilter('xmlEscape', value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]));
  config.addGlobalData('site', { name: 'ssup', author: '정명섭', url: 'https://jmssup.github.io', github: 'https://github.com/jms-50', tistory: 'https://myinfosub.tistory.com', description: '개발과 보안, 그리고 연구. 직접 해보고 이해한 것들을 기록합니다.' });
  return { dir: { input: 'src', output: '_site' }, markdownTemplateEngine: false, htmlTemplateEngine: false };
}
