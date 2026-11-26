import { readFileSync } from 'node:fs';

const reviewed = JSON.parse(readFileSync(new URL('../migration/categories.json', import.meta.url), 'utf8'));
const categories = JSON.parse(readFileSync(new URL('../src/_data/categories.json', import.meta.url), 'utf8'));
const aliases = {
  '컴파일러, 계산이론, 언어': 'cs/compilers',
  '알고리즘': 'cs/algorithms',
  '자료구조': 'cs/data-structures',
  '인공지능': 'ai',
  'rust': 'development/rust',
  'security/forensic': 'security/forensics',
  '모각코/2025 하계 모각코': 'study-logs/2025-summer',
  '모각코/2025 동계 모각코': 'study-logs/2025-winter',
  '모각코/2026 하계 모각코': 'study-logs/2026-summer'
};

export function categoryFor(original = '', title = '', id) {
  const assigned = reviewed.posts[id]?.category;
  if (assigned) return assigned;
  const source = original.trim().toLowerCase();
  const category = categories.find(item => item.vaultPath.toLowerCase() === source);
  if (category) return category.id;
  if (aliases[source]) return aliases[source];
  throw new Error(`새 글의 분류를 검토해 주세요: ${title} (${original || '분류 없음'})`);
}
