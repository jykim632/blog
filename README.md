# 여백의 기록

일과 기술, 그리고 오래 붙잡고 싶은 장면을 기록하는 개인 블로그입니다. Astro로 정적 사이트를 만들고 Cloudflare Pages에 배포합니다.

## 시작하기

Node.js와 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev
```

개발 서버는 기본적으로 `http://localhost:4321`에서 실행됩니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 로컬 개발 서버 실행 |
| `pnpm build` | 타입 검사 후 정적 사이트 빌드 |
| `pnpm preview` | 빌드 결과 미리 보기 |
| `pnpm cf:dev` | Cloudflare Pages 및 로컬 D1 환경에서 결과 확인 |
| `pnpm db:migrate:local` | 로컬 D1 마이그레이션 적용 |
| `pnpm db:migrate:remote` | 원격 D1 마이그레이션 적용 |

## 콘텐츠

글은 `src/content/posts/`에 Markdown 파일로 작성합니다. `draft: true`인 글은 로컬·배포 빌드 모두에서 공개 목록과 상세 페이지에서 제외됩니다.

```md
---
title: 글 제목
summary: 글 목록에 보일 짧은 소개
publishedAt: 2026-07-19
category: WORK & CRAFT
tags:
  - 태그
cover: /images/post-cover.jpg
coverAlt: 글 커버 이미지 설명
draft: false
---

본문을 Markdown으로 작성합니다.
```

글을 추가한 뒤 GitHub에 push하면 Astro가 홈 목록과 `/posts/파일명` 상세 페이지를 자동으로 생성합니다.

## 프로젝트 구조

```text
src/
  components/       공통 UI 컴포넌트
  content/posts/    Markdown 블로그 글
  layouts/          공통 레이아웃
  pages/            페이지와 라우트
db/migrations/      Cloudflare D1 마이그레이션
docs/               로드맵 및 API·DB 설계 문서
```

## 배포

Cloudflare Pages는 `pnpm build` 결과물인 `dist/`를 배포합니다. 배포 설정은 `wrangler.jsonc`에 있습니다.

현재 블로그는 Git 기반의 정적 콘텐츠 발행을 기본 흐름으로 사용합니다. D1과 posts API 관련 문서는 향후 CMS 도입을 검토하기 위한 설계 자료이며, 상세 방향은 [로드맵](docs/roadmap.md)을 참고하세요.

## 이미지 관리

`/admin/media`는 Cloudflare Access로 보호되는 이미지 관리 화면입니다. 이미지 원본은 R2에, 파일명·대체 텍스트·URL 등의 정보는 D1 `media_assets` 테이블에 저장합니다. 배포 전에 R2 binding `MEDIA_BUCKET`, D1 binding `DB`, 그리고 Access 환경값을 Cloudflare Pages 프로젝트에 설정해야 합니다. 상세한 API·설정 계약은 [이미지 API 문서](docs/media-api-contract.md)를 참고하세요.
