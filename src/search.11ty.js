import { load } from 'cheerio';
import categories from './_data/categories.json' with { type: 'json' };
export default class {
  data() { return { permalink: '/search.json', eleventyExcludeFromCollections: true }; }
  render({ collections }) {
    return JSON.stringify(collections.posts.map(post => ({ title: post.data.title, url: post.url, date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(post.date), category: categories.find(c => c.id === post.data.category)?.name, originalCategory: post.data.originalCategory || '', description: post.data.description || '', text: load(post.templateContent || '').text().replace(/\s+/g, ' ').trim() })));
  }
}
