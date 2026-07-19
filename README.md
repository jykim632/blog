# 여백의 기록

일과 기술, 그리고 오래 붙잡고 싶은 장면을 기록하는 개인 블로그입니다. Astro와 Cloudflare Workers로 운영하며, 발행한 글은 D1에서 즉시 공개됩니다.

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
| `pnpm build` | 타입 검사 후 Cloudflare Worker 빌드 |
| `pnpm preview` | 빌드 결과 미리 보기 |
| `pnpm cf:dev` | 빌드한 Cloudflare Worker 및 로컬 D1 환경에서 결과 확인 |
| `pnpm db:migrate:local` | 로컬 D1 마이그레이션 적용 |
| `pnpm db:migrate:remote` | 원격 D1 마이그레이션 적용 |

## 콘텐츠

글은 `/admin/posts`에서 작성합니다. 저장한 글은 D1 초안으로 남고, **발행**을 누르면 즉시 공개 목록과 `/posts/주소`에 반영됩니다. 별도 Git push나 전체 사이트 재빌드는 필요하지 않습니다.

기존 `src/content/posts/`의 Markdown 파일은 디자인·콘텐츠 참고용으로 남아 있으며, 공개 사이트의 원본은 D1입니다.

## 프로젝트 구조

```text
src/
  components/       공통 UI 컴포넌트
  content/posts/    기존 Markdown 참고 글
  layouts/          공통 레이아웃
  pages/            페이지와 라우트
db/migrations/      Cloudflare D1 마이그레이션
docs/               로드맵 및 API·DB 설계 문서
```

## 배포

Cloudflare Workers는 `pnpm build` 결과물인 `dist/`의 Astro Worker를 배포합니다. 배포 설정은 `wrangler.jsonc`에 있습니다. 공개 목록과 상세 페이지는 Worker에서 D1의 `published` 글만 조회해 렌더링하고, 정적 CSS·JavaScript·이미지는 Cloudflare Assets로 제공됩니다.

배포 전에는 `pnpm build` 후 `pnpm cf:dev`로 Worker와 로컬 D1 binding을 함께 확인하세요. 배포 명령은 `pnpm deploy`입니다.

## 이미지 관리

`/admin`은 로그인된 관리자만 `/admin/media`로 이동시키는 진입점이며, `/admin/media`는 이미지 관리 화면입니다. Cloudflare Access 애플리케이션에서 `/admin/*`와 `/api/admin/*`를 보호하면 비로그인 사용자는 Access 로그인 화면으로 이동하고, 로그인 후 원래 요청한 관리 화면으로 돌아옵니다. 이미지 원본은 R2에, 파일명·대체 텍스트·URL 등의 정보는 D1 `media_assets` 테이블에 저장합니다. 배포 전에 R2 binding `MEDIA_BUCKET`, D1 binding `DB`, 그리고 Access 환경값을 Cloudflare Worker에 설정해야 합니다. 상세한 API·설정 계약은 [이미지 API 문서](docs/media-api-contract.md)를 참고하세요.
