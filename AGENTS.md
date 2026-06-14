# 프로젝트 지침

- 항상 한국어로 답변
- Hugo 프로젝트 구조를 우선 준수
- 서버 실행은 사용자가 직접 수행
- public/ 디렉터리는 생성 산출물로 보고 직접 수정하지 않음
- 코드 변경 후 가능한 경우 hugo --gc --minify로 검증
- JS/CSS 빌드가 있으면 pnpm lint 또는 pnpm test도 실행
- 기존 theme, layouts, partials 스타일을 우선 따른다

# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성

이 저장소는 Hugo 기반 기술 블로그로, GitHub Pages에 배포됩니다.

- `hugo.toml` — 사이트 설정, 로케일, 제목, 작성자, 활성 테마를 포함.
- `content/posts/` — Markdown 파일 형태의 블로그 포스트 보관.
- `archetypes/default.md` — 새 콘텐츠의 기본 front matter 템플릿 정의.
- `themes/` — 사용 가능한 Hugo 테마 목록. 현재 `PaperMod`가 활성화.
- `layouts/`, `assets/`, `static/`, `data/`, `i18n/` — 사이트 수준 오버라이드 및 커스텀 에셋 디렉터리.
- `public/` — Hugo 빌드 산출물. 수동으로 편집하지 않음.
- `.github/workflows/hugo.yaml` — `main` 브랜치 push 시 사이트를 빌드하고 배포.

`themes/` 내부를 직접 수정하는 것보다 사이트 수준 오버라이드를 우선 사용할 것. 테마 자체를 변경하는 경우에만 예외.

## 빌드·테스트·개발 명령어

사이트 작업에는 Hugo를 사용. Node 툴링이 추가되는 경우 `pnpm`을 사용하고, `npm` 또는 `yarn` 락파일은 생성하지 않음.

```bash
hugo server -D
```

드래프트 포스트를 포함한 로컬 미리보기 서버를 실행. 서버 실행은 사용자가 직접 수행.

```bash
hugo --minify
```

프로덕션 사이트를 `public/`에 빌드.

```bash
hugo new posts/<slug>.md
```

`archetypes/default.md`를 기반으로 새 포스트를 생성.

## 코딩 스타일 및 네이밍 컨벤션

포스트는 Markdown으로 작성하고, front matter는 아키타입에 맞는 TOML/YAML을 사용. 포스트 파일명은 소문자·하이픈 형식으로 작성 (예: `content/posts/github-pages-hugo.md`).

설정 파일은 `hugo.toml`의 기존 TOML 스타일을 따름: 문자열 따옴표 처리, 단순한 키, 필요한 경우에만 간단한 주석 추가. 커스텀 템플릿·에셋은 번들된 테마 파일을 수정하지 않고 최상위 오버라이드 디렉터리에 배치.

## 테스트 가이드라인

이 저장소에는 별도의 테스트 프레임워크가 없음. 다음 명령어로 변경 사항을 검증:

```bash
hugo --minify
```

콘텐츠 변경 시에는 가능하면 `hugo server -D`로 미리보기 후 게시. front matter에 `title`, `date`, `draft` 값이 올바르게 포함되었는지 확인.

## 커밋 및 PR 가이드라인

최근 커밋 메시지는 `first`, `second`, `github actions`처럼 짧고 직접적인 스타일을 사용. 커밋은 간결하고 집중적으로 유지하되, `add hugo contributor guide`나 `update pages workflow` 같이 의미가 명확한 메시지를 권장.

PR에는 간략한 요약, 영향받는 경로, 수행한 검증 내용, 그리고 테마·레이아웃 변경 시 스크린샷을 포함. 관련 이슈가 있으면 링크 첨부.

## 에이전트별 지침

이 저장소에서 작업할 때는 항상 한국어로 답변. 개발 서버를 직접 시작하지 않으며, 서버 실행은 사용자에게 위임. 코드 또는 문서 변경 후에는 가능한 경우 `pnpm test`, `pnpm lint`, 또는 적절한 Hugo 명령어로 검증.
