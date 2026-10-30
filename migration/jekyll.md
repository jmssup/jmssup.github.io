# Jekyll 전환 기록

2026-10-30에 페이지 생성기를 Eleventy에서 Jekyll 4.4로 전환했습니다. Ruby 3.3과 Bundler를 사용하며, GitHub Actions에서 빌드한 `_site/`를 배포합니다.

## 변경한 구조

| 기존 | 변경 후 |
| --- | --- |
| `eleventy.config.js` | `_config.yml` |
| Nunjucks `.njk` 템플릿 | Liquid를 사용하는 `.html` 템플릿 |
| `src/_includes/base.njk`, `post.njk` | `src/_layouts/base.html`, `post.html` |
| 하나의 카테고리 생성 템플릿 | 공통 `category` 레이아웃과 카테고리 페이지 6개 |
| `src/posts/tistory/번호.html` | `src/_posts/날짜-tistory-번호.html` |
| JavaScript 검색 데이터 생성 | Liquid 검색 JSON 생성 |
| Eleventy 읽기 시간 필터 | Ruby Liquid 필터 |

기존 `/posts/tistory/번호/` 주소는 각 글의 `permalink`로 유지합니다. 가져온 글에는 `render_with_liquid: false`를 지정해 코드의 중괄호와 Liquid 예제를 실행하지 않습니다. 새 Markdown 글에도 같은 기본 설정을 적용합니다.

## 확인한 항목

- 실제 Jekyll 빌드 성공.
- 글 139개의 제목·작성일·본문 해시·이미지 개수와 기존 주소 보존. 기록된 GitHub 계정 주소 정정도 유지.
- CSS·브라우저 JavaScript·이미지 파일 41개의 SHA-256이 전환 전과 모두 동일.
- 홈페이지의 카테고리 이름·개수, 글 제목·작성일·글 링크가 전환 전과 동일.
- 6개 카테고리, 내부 링크, 검색 JSON, Atom 피드, 사이트맵 검증 통과.
- 임시 Markdown 글로 날짜 기반 파일명, 자동 주소, 한국 시간 날짜, 검색 포함과 코드 블록의 Liquid 미실행 확인. 임시 글은 제거.

원본에서 접근할 수 없었던 이미지 13개의 상태는 [이전 보고서](README.md)에 남아 있습니다.

## 방문자 터미널 추가

Jekyll 전환 후 홈에 방문자가 명령어를 입력하는 터미널을 추가했습니다. 기존 CSS·브라우저 JavaScript를 수정하지 않고 `terminal.css`와 `terminal.js`를 추가했습니다. 홈 소개 영역은 이 스타일시트에서 간결하게 조정합니다.

카테고리 6개와 실제 글 139개를 디렉터리·파일 경로로 연결합니다. `ls`, `cd`, `pwd`, `cat`, `grep`, `open`, `help`, `whoami`, `history`, `clear`, 명령 기록 탐색과 Tab 자동완성을 제공합니다. `cat`은 실제 글 HTML에서 본문을 읽어 텍스트로 출력합니다. 실행 서버·데이터베이스는 추가하지 않습니다. 참고한 상호작용은 [Red Raccoon](https://www.redraccoon.kr/)의 입력형 터미널입니다.

`scripts/check-terminal.mjs`가 빌드된 글 데이터로 명령 처리와 경로 매핑을 검사하며 `npm run check`에 포함됩니다.

브라우저에서 `cd → pwd → grep → cat → open`, Tab 자동완성, ↑ 명령 기록, 잘못된 HTML 입력의 텍스트 출력을 확인했습니다. 390px 모바일에서 가로 넘침이 없고 메뉴·명령 입력·검색이 동작합니다. 기존 검색의 OP-TEE 결과 3개와 CTF 필터도 확인했습니다.

## 실행

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 8080
```

`src/_posts/날짜-이름.md`로 글을 작성합니다. 브라우저 동작은 `src/assets/site.js`와 `src/assets/theme.js`, 디자인은 `src/assets/style.css`에서 수정합니다. 이전·검증 도구의 Node.js 의존성은 별도로 유지합니다.
