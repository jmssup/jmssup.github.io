# ssup — 정명섭의 기록

GitHub Pages용 개인 기술 블로그입니다. 선택한 1번 시안에 맞춰 흰색·청록색을 중심으로 구성한 반응형 디자인이며, 처음 방문하면 밝은 테마를 표시합니다. 테마 전환 버튼으로 선택한 설정은 다음 방문에도 유지됩니다. [Eleventy](https://www.11ty.dev/)가 Markdown/HTML 글을 정적 페이지로 만듭니다.

## 실행

Node.js 24 이상을 사용합니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 `http://localhost:8080`에서 확인합니다. 글·템플릿·CSS 변경 시 자동으로 다시 빌드됩니다.

```sh
npm run build
npm run check
```

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

## 새 글 쓰기

`src/posts/`에 Markdown 파일을 추가합니다. 예를 들어 `src/posts/rust-ownership.md`:

```md
---
title: "Rust 소유권을 이해하며"
date: "2026-10-29T20:00:00+09:00"
category: development
description: "소유권과 빌림을 직접 실험해 본 기록입니다."
---

여기에 본문을 작성합니다.
```

위 예시는 작성법을 보여주는 문서이며 실제 글로 게시되어 있지 않습니다. 파일명으로 `/posts/rust-ownership/` 주소가 만들어집니다. 이미지는 `src/assets/`에 넣고 `/assets/파일명.png`로 참조합니다. Markdown 안의 `{{ ... }}` 등 코드가 템플릿으로 실행되지 않도록 설정했습니다.

소개는 `src/about.njk`, 색상·레이아웃은 `src/assets/style.css`, 분류 이름과 설명은 `src/_data/categories.json`, 사이트 URL과 GitHub 링크는 `eleventy.config.js`에서 수정합니다.

## 티스토리 이전

[기존 블로그](https://myinfosub.tistory.com)의 공개 글 139개를 가져왔습니다. 자세한 검증 결과와 원본에서 404가 발생한 이미지 13개의 범위는 [이전 보고서](migration/README.md)에 있습니다.

```sh
npm run import:tistory
npm run build
npm run check
```

이전 도구는 공개 사이트맵을 읽으며 이미 가져온 글은 덮어쓰지 않습니다. 원본 HTML 캐시는 `.cache/tistory/`에 보관되며 Git에서 제외됩니다. `--refresh`는 원본을 다시 내려받고 가져온 글을 덮어쓰므로, 가져온 글을 직접 수정한 후에는 사용하지 마세요.

비공개·보호 글, 댓글, 티스토리 통계는 공개 페이지에서 가져오지 않습니다. 티스토리의 글 주소를 변경하거나 삭제하지 않습니다. 로컬 글 사이의 링크는 새 주소로 연결하며, 원본 링크도 각 글에 남깁니다. 티스토리 도메인에 대한 자동 리디렉션은 별도 설정이 필요합니다.

## GitHub Pages 배포

배포 워크플로는 [GitHub의 공식 Pages 워크플로 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)에 맞췄습니다.

1. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
2. 변경 사항을 검토하고 `main` 브랜치에 올립니다.
3. `Build and deploy blog` 워크플로가 빌드·검증 후 배포합니다.

배포 주소는 `https://jmssup.github.io`입니다. 기능 브랜치에 코드를 올리는 것과 사이트 배포는 별개이며, Pages 설정 후 `main`에 반영하면 배포됩니다. Pull Request에서는 빌드와 검증만 실행합니다.

프로필의 GitHub 링크와 호스팅 저장소 계정은 모두 `jmssup`을 사용합니다.

## 확인 범위

`npm run check`는 이전한 글 전체의 제목·작성일·본문 텍스트 SHA-256·이미지 개수, 6개 카테고리, 생성 페이지의 내부 링크와 로컬 파일, 검색 인덱스, RSS와 사이트맵을 검사합니다. 외부 사이트 링크의 장기 생존 여부나 비공개 글까지 확인하는 검사는 아닙니다.
