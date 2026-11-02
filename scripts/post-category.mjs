import { readFileSync } from 'node:fs';

const reviewed = JSON.parse(readFileSync(new URL('../migration/categories.json', import.meta.url), 'utf8'));

export function categoryFor(original = '', title = '', id) {
  const assigned = reviewed.posts[id]?.category;
  if (assigned) return assigned;
  const context = `${original} ${title}`;
  if (/bounty|버그.?바운티/i.test(context)) return 'bug-bounty';
  if (/개발.?일지|포팅|구현|제작/i.test(title) && !/개념|원리|설명|사용법|특징/i.test(title)) return 'development';
  if (/\[(?:Dreamhack|Fuzzing101|pwn\.college)\]/i.test(title) || /CTF|wargame|워게임/i.test(original) || (/CTF|워게임|wargame/i.test(title) && /문제|풀이|write.?up|challenge/i.test(title))) return 'ctf';
  if (/논문|컨퍼런스|학회|ICCE|WISA/i.test(context)) return 'research';
  if (/공모전|자격증|수상|정보처리기사|정보보안기사/i.test(context)) return 'achievements';
  return 'writing';
}
