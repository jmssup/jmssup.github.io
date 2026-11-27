# ssup — 정명섭의 기록

Obsidian Vault에서 공개 글을 작성하고 Quartz로 빌드해 [jmssup.github.io](https://jmssup.github.io)의 루트에 배포합니다.

## 저장 위치와 배포 흐름

```text
~/Vault/Knowledge/
├── 10 Projects/ · 20 Knowledge/ · 30 Courses/   글의 원문
├── 40 Blog/                                     공개본과 블로그 목차
│   ├── index.md                                 사이트 홈 /
│   ├── about.md                                 소개 /about/
│   └── CS/ · Security/ · Development/ · AI/ · Study Logs/ · Troubleshooting/
└── 90 Attachments/Blog/                          공개 글에 사용할 첨부파일
                ↓ 로컬에서 npm run sync:blog
~/jmssup.github.io/
├── content/                                     내보낸 Markdown과 media/ 첨부파일
├── quartz.config.yaml                           Quartz 설정
└── .github/workflows/pages.yml                   GitHub Actions 배포 설정
                ↓ content/를 커밋하고 main에 반영
GitHub Actions → Quartz → _site/ → jmssup.github.io/
```

예를 들어 **여러가지 정렬**의 본문은 `20 Knowledge/CS/Algorithms/여러가지 정렬.md`에서 수정합니다. `40 Blog/CS/Algorithms/여러가지 정렬.md`가 원문을 임베드하며, 내보낸 본문은 저장소의 `content/CS/Algorithms/여러가지 정렬.md`에 생성됩니다.

## 글 작성과 발행

1. Vault의 `40 Blog`에 공개본을 작성하고, 발행할 글의 `status`를 `complete`로 설정합니다.
2. `40 Blog`에 본문을 직접 쓰는 글은 `publish`를 비워둡니다. 원문을 불러오는 글은 양쪽 노트의 `publish`에 상대 노트의 위키링크를 넣고, 공개본 본문에 `![[원문 경로]]`, `![[원문 경로#절 제목]]`, `![[원문 경로#^블록ID]]` 중 필요한 임베드를 넣습니다.
3. 공개할 첨부파일은 Vault의 `90 Attachments/Blog`에 두고, 공개할 본문에서 참조합니다.
4. 저장소 루트에서 공개본을 내보내고 빌드합니다.

```sh
cd ~/jmssup.github.io
npm ci
npm run sync:blog
npm run build
npm run check
npm run preview:site
```

`npm ci`는 최초 설치나 의존성이 바뀌었을 때 실행합니다. 미리보기 주소는 `http://127.0.0.1:8080/`입니다.

`sync:blog`는 기본적으로 `~/Vault/Knowledge`를 읽습니다. Vault 위치가 다르면 `npm run sync:blog -- "/path/to/vault"`를 사용합니다. 공개본의 임베드는 실제 본문으로 펼쳐지고, 참조된 첨부와 함께 `content/`에 저장됩니다. 공개본이 없는 노트의 링크는 표시 문구만 남습니다.

`content/`는 내보낼 때마다 다시 생성합니다. 본문은 Vault에서 수정하고, 생성된 `content/`의 변경 사항을 검토한 뒤 파일 삭제분까지 함께 커밋합니다.

## GitHub Pages

저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**를 사용합니다. 최초 전환 시 `content/`와 Quartz 설정, 스크립트, 배포 워크플로를 함께 `main`에 반영합니다. 이후에는 글을 내보내 생성한 `content/` 변경을 `main`에 반영하면 됩니다.

Actions는 커밋된 `content/`를 Quartz 5.2.2로 빌드하고, 생성한 `_site/`를 사이트 루트에 배포합니다. Vault 내보내기는 로컬에서 실행합니다. PR에서는 빌드와 검증을 실행합니다. [배포 워크플로](.github/workflows/pages.yml) · [Quartz GitHub Pages 문서](https://quartz.jzhao.xyz/hosting#github-pages)

예전 `/posts/tistory/번호/`와 `/categories/…/`는 같은 글이나 분류의 Quartz 주소로 이동합니다. `/about/`와 `/feed.xml`도 기존 주소에서 열립니다.

## 기존 Jekyll 기록

`src/`의 터미널 블로그와 티스토리 이관 자료는 이전 기록으로 보관합니다. 기존 빌드와 검증은 Ruby 3.3, Bundler, `npm ci`를 준비한 뒤 `npm run check:jekyll`로 실행할 수 있습니다. 이 명령은 로컬 `_site/`를 Jekyll 결과로 갱신하므로 Quartz를 다시 보려면 `npm run build`를 실행합니다.

콘솔 테마 작업은 밝은 연녹색 배경(`#f5f7f5`), 본문 Noto Sans KR, 코드 JetBrains Mono를 사용합니다. 자세한 내용은 [Jekyll 전환 기록](migration/jekyll.md)과 [티스토리 이전 보고서](migration/README.md)에 있습니다.
