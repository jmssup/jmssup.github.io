# ssup — 정명섭의 기록

Jekyll 4와 Liquid를 사용하는 GitHub Pages용 개인 기술 블로그입니다. 선택한 1번 시안에 맞춰 흰색·청록색을 중심으로 구성한 반응형 디자인이며, 처음 방문하면 밝은 테마를 표시합니다. 테마 전환 버튼으로 선택한 설정은 다음 방문에도 유지됩니다. [Jekyll](https://jekyllrb.com/)이 Markdown/HTML 글을 정적 페이지로 만듭니다. 메뉴·검색·테마 전환은 프레임워크 없는 브라우저 JavaScript가 담당합니다.

## 실행

Ruby 3.3과 Bundler를 사용합니다. Node.js 24는 이전·검증 도구를 실행할 때 사용합니다.

macOS에서 Ruby가 없다면 다음 명령으로 설치합니다.

```sh
brew install ruby@3.3
export PATH="$(brew --prefix ruby@3.3)/bin:$PATH"
```

```sh
bundle config set --local path vendor/bundle
bundle install
npm ci
bundle exec jekyll serve --host 127.0.0.1 --port 8080
```

터미널에 표시되는 `http://localhost:8080`에서 확인합니다. 글·템플릿·CSS 변경 시 자동으로 다시 빌드됩니다.

```sh
bundle exec jekyll build
npm run check
```

`npm run dev`와 `npm run build`도 위 Jekyll 명령을 실행하는 편의 명령입니다. `_config.yml`이나 Ruby 플러그인을 변경하면 서버를 다시 시작합니다.

최종 정적 파일은 `_site/`에 생성됩니다. 이 폴더는 Git에 올리지 않습니다.

## 카테고리

| 표시 이름 | 글의 category 값 |
| --- | --- |
| 개발 | `development` |
| CTF/Wargame | `ctf` |
| Bug Bounty | `bug-bounty` |
| 블로그/기술문서 | `writing` |
| 논문/컨퍼런스 | `research` |
| 공모전/자격증 | `achievements` |

모든 카테고리가 항상 보이며 글 수는 자동 집계됩니다. 글이 없는 카테고리에는 빈 목록 안내가 표시됩니다. 검색은 제목·본문·원래 분류·새 카테고리를 대상으로 합니다. 테마 전환, RSS(`/feed.xml`), 사이트맵도 포함되어 있습니다.

## 방문자 터미널

홈의 터미널에서 카테고리를 디렉터리로 탐색하고 실제 글을 읽습니다. 예를 들어:

```sh
help
ls
cd development
ls
cat tistory-147.md
grep "OP-TEE"
open tistory-147.md
cd ..
```

`pwd`, `whoami`, `history`, `clear`도 지원합니다. Tab은 명령어·경로를 자동완성하고, ↑↓는 명령 기록을 탐색합니다. Esc는 입력 포커스를 해제합니다. 표시된 명령어·파일은 클릭할 수 있습니다. `grep`은 현재 디렉터리에서 검색하며 `grep OP-TEE /`처럼 전체 범위를 지정할 수 있습니다.

`src/assets/terminal.js`가 블로그 명령을 해석합니다. `/search.json`과 글 HTML을 GET으로 읽고 결과를 텍스트로 출력하므로 별도 애플리케이션 서버가 필요 없습니다. 방문자의 입력은 운영체제 명령으로 실행되지 않으며, 글 수정·발행은 Markdown 편집과 Git으로 관리합니다. 출력은 최근 명령 40개, 명령 기록은 이번 페이지 방문의 최근 100개까지 유지합니다. 일반 글 목록도 함께 제공됩니다.

## 새 글 쓰기

`src/_posts/`에 Markdown 파일을 추가합니다. 예를 들어 `src/_posts/2026-10-30-rust-ownership.md`:

```md
---
title: "Rust 소유권을 이해하며"
date: "2026-10-30T20:00:00+09:00"
category: development
description: "소유권과 빌림을 직접 실험해 본 기록입니다."
---

여기에 본문을 작성합니다.
```

위 예시는 작성법을 보여주는 문서이며 실제 글로 게시되어 있지 않습니다. `날짜-이름.md` 형식으로 작성하며, 위 파일의 주소는 `/posts/rust-ownership/`입니다. 다른 주소를 원하면 `permalink`를 지정합니다. 이미지는 `src/assets/`에 넣고 `/assets/파일명.png`로 참조합니다. 글은 기본적으로 `post` 레이아웃을 사용합니다. `_config.yml`의 `render_with_liquid: false` 설정으로 본문의 `{{ ... }}` 등 코드가 템플릿으로 실행되지 않도록 했습니다.

소개는 `src/about.html`, 색상은 `src/assets/style.css`, 화면의 틀은 `src/_layouts/`, 공통 HTML은 `src/_includes/`, 분류 정보는 `src/_data/categories.json`에서 수정합니다. 사이트 URL과 GitHub 링크는 `_config.yml`에 있습니다. 브라우저 동작은 `src/assets/site.js`와 `src/assets/theme.js`에서 담당합니다.

HTML의 `{{ ... }}`와 `{% ... %}`는 빌드할 때 처리되는 Liquid 문법입니다. `src/_plugins/blog_filters.rb`는 검색용 본문 텍스트와 읽기 시간을 계산합니다.

## 티스토리 이전

[기존 블로그](https://myinfosub.tistory.com)의 공개 글 139개를 가져왔습니다. 자세한 검증 결과와 원본에서 404가 발생한 이미지 13개의 범위는 [이전 보고서](migration/README.md)에 있습니다.

```sh
npm run import:tistory
bundle exec jekyll build
npm run check
```

이전 도구는 `src/_posts/날짜-tistory-번호.html`에 저장하고 기존 `/posts/tistory/번호/` 주소를 유지합니다. 공개 사이트맵을 읽으며 이미 가져온 글은 덮어쓰지 않습니다. 원본 HTML 캐시는 `.cache/tistory/`에 보관되며 Git에서 제외됩니다. `--refresh`는 원본을 다시 내려받고 가져온 글을 덮어쓰므로, 가져온 글을 직접 수정한 후에는 사용하지 마세요.

비공개·보호 글, 댓글, 티스토리 통계는 공개 페이지에서 가져오지 않습니다. 티스토리의 글 주소를 변경하거나 삭제하지 않습니다. 로컬 글 사이의 링크는 새 주소로 연결하며, 원본 링크도 각 글에 남깁니다. 티스토리 도메인에 대한 자동 리디렉션은 별도 설정이 필요합니다.

## GitHub Pages 배포

배포 워크플로는 Ruby 3.3·Jekyll 4로 빌드하고 Node.js 검증을 통과한 `_site/`를 배포합니다. Ruby 의존성은 `Gemfile.lock`, Node.js 도구 의존성은 `package-lock.json`으로 고정합니다. Pages 소스는 **GitHub Actions**를 유지합니다.

[GitHub의 공식 Pages 워크플로 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)에 맞췄습니다.

1. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
2. 변경 사항을 검토하고 `main` 브랜치에 올립니다.
3. `Build and deploy Jekyll blog` 워크플로가 빌드·검증 후 배포합니다.

배포 주소는 `https://jmssup.github.io`입니다. 기능 브랜치에 코드를 올리는 것과 사이트 배포는 별개이며, Pages 설정 후 `main`에 반영하면 배포됩니다. Pull Request에서는 빌드와 검증만 실행합니다.

프로필의 GitHub 링크와 호스팅 저장소 계정은 모두 `jmssup`을 사용합니다.

## 확인 범위

`npm run check`는 이전한 글 전체의 제목·작성일·본문 텍스트 SHA-256·이미지 개수, 6개 카테고리, 생성 페이지의 내부 링크와 로컬 파일, 검색 인덱스, RSS와 사이트맵을 검사합니다. 외부 사이트 링크의 장기 생존 여부나 비공개 글까지 확인하는 검사는 아닙니다.

터미널의 실제 글 경로 매핑·디렉터리 이동·검색·명령 파싱·자동완성·잘못된 입력 처리도 검사합니다. Jekyll 전환 내역은 [전환 기록](migration/jekyll.md)에 있습니다.
