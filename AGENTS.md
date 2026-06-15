# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기본 규칙

- 항상 한국어로 답변
- 개발 서버를 직접 실행하지 않음 — 서버 실행은 사용자가 직접 수행
- `public/` 디렉터리는 빌드 산출물이므로 직접 수정하지 않음
- `themes/` 내부를 직접 수정하지 않음 — 최상위 오버라이드 디렉터리 사용

## 명령어

```bash
# 프로덕션 빌드 (변경 검증용)
hugo --gc --minify

# 새 포스트 생성 (archetypes/default.md 기반)
hugo new posts/<slug>.md

# Node 스크립트 의존성 설치
pnpm install

# Velog 로컬 수동 배포 (VELOG_REFRESH_TOKEN 환경변수 필요)
node scripts/publish-velog.js
```

## 아키텍처

### GitHub Actions 이중 워크플로우

| 파일 | 트리거 | 역할 |
|------|--------|------|
| `.github/workflows/hugo.yaml` | `main` push (전체) | Hugo 빌드 → GitHub Pages 배포 |
| `.github/workflows/publish.yaml` | `main` push (`content/posts/**`) | Velog 자동 게시 |

`publish.yaml`은 완료 후 `data/velog-index.json`을 `[skip ci]` 커밋으로 push하여 무한 루프를 방지.

### PaperMod 테마 커스터마이징 구조

PaperMod가 제공하는 훅 파셜(hook partial)에만 코드를 추가:

- `layouts/_partials/extend_head.html` — 전역 CSS (읽기 진행 바, 타이포그래피, TOC, 태그 pill, 홈 히어로 등)
- `layouts/_partials/extend_post_content.html` — 포스트 본문 하단 JS (읽기 진행 바 스크립트, 맨 위로 버튼)

테마 변수(`--primary`, `--border`, `--theme`, `--code-bg`)를 통해 다크/라이트 모드가 자동 대응됨.
`disableScrollToTop = true`로 테마 내장 버튼을 비활성화하고, `extend_post_content.html`의 커스텀 버튼으로 대체.

### Velog 배포 파이프라인

Velog는 공식 API가 없어 `https://v3.velog.io/graphql` 비공식 GraphQL을 사용.
인증은 `refresh_token` 쿠키로 액세스 토큰을 먼저 발급받는 2단계 방식.

```
content/posts/*.md (velog: true)
  → scripts/publish-velog.js
      → gray-matter로 front matter 파싱
      → refreshToken mutation으로 access_token 발급
      → data/velog-index.json 조회
          없음 → writePost mutation (신규, id 저장)
          있음 → editPost mutation  (수정)
      → data/velog-index.json에 slug → postId(UUID) 저장
```

필요한 GitHub Secrets:
- `VELOG_REFRESH_TOKEN` — Velog 로그인 후 브라우저 쿠키에서 추출, 장기 만료
- `VELOG_USERNAME` — (선택) 성공 로그 URL 출력용

## 포스트 Front Matter

아키타입(`archetypes/default.md`)은 TOML(`+++`) 형식이지만 포스트는 YAML(`---`)도 사용 가능. 파일명은 소문자·하이픈 형식.

```yaml
---
title: "포스트 제목"
date: 2026-06-15T10:00:00+09:00
draft: false
tags: ["tag1", "tag2"]
velog: true    # 생략하거나 false이면 Velog 배포 건너뜀
---
```

## 사이트 설정 (`hugo.toml`)

- `baseURL`: `https://anabasis.github.io`
- 활성 테마: `PaperMod` (대안 테마는 주석 처리됨 — stack, coder, LoveIt 등)
- 홈 출력 포맷: `HTML, RSS, JSON` (JSON은 Fuse.js 클라이언트 검색에 필요)
