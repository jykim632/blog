# Posts API contract (v1)

This contract is the boundary between the `/admin/posts` app and D1. It is implemented through a repository layer, not from Astro pages directly.

## Authentication and response rules

- 공개 페이지는 Worker SSR에서 published 글만 직접 조회한다. 초안과 보관 글은 공개 경로에 노출되지 않는다.
- Every `/api/admin/*` endpoint requires the approved Cloudflare Access/OAuth identity.
- All JSON requests and responses use UTF-8 and ISO-8601 UTC timestamps.

## Response envelope: discriminated union

Every endpoint returns the same discriminated union. Client code must branch on `ok` before accessing `data` or `error`; it must not infer a response shape from an HTTP status alone.

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError =
  | {
      ok: false;
      error: {
        code: 'VALIDATION_ERROR';
        message: string;
        fields: Record<string, string>;
      };
    }
  | {
      ok: false;
      error: {
        code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'SLUG_CONFLICT' | 'UNSAFE_CONTENT' | 'INTERNAL_ERROR';
        message: string;
      };
    };

type ApiResult<T> = ApiSuccess<T> | ApiError;
```

```ts
const result: ApiResult<Post> = await updatePost(input);

if (!result.ok) {
  if (result.error.code === 'VALIDATION_ERROR') showFieldErrors(result.error.fields);
  return;
}

renderPost(result.data);
```

HTTP status still carries transport meaning, while the JSON body retains the union shape in every case.

## Runtime responsibilities

| Layer | Location | Responsibility |
| --- | --- | --- |
| Admin UI | `src/pages/admin/posts.astro` | Renders the post queue and editor; calls APIs but never accesses D1 directly. |
| Worker API routes | `src/pages/api/admin/posts/*` | Runs in the Workers runtime; authenticates requests, validates input, and returns `ApiResult`. |
| Repository | `functions/api/admin/posts/repository.ts` | Owns all prepared D1 queries and post/tag relationship writes. |
| Public SSR routes | `src/pages/index.astro`, `src/pages/posts/*` | Query published posts through the repository and render them on demand. |
| Validation | `functions/api/admin/posts/schema.ts` | Validates API input and the permitted canonical editor document shape. |

| HTTP status | `error.code` |
| --- | --- |
| `400` | `VALIDATION_ERROR`, `UNSAFE_CONTENT` |
| `401` | `UNAUTHENTICATED` |
| `403` | `FORBIDDEN` |
| `404` | `NOT_FOUND` |
| `409` | `SLUG_CONFLICT` |
| `500` | `INTERNAL_ERROR` |

## Tiptap document input

```json
{
  "type": "doc",
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "본문" }] }]
}
```

The API accepts a JSON document, validates the allowed node/mark set, serializes it into `posts.content_json`, and derives `content_text`. Clients never send rendered HTML as the stored source of truth. The allowlist includes `image` nodes with a valid absolute `src` URL and an `alt` string of up to 240 characters, plus `link` marks with an absolute `href`; public rendering emits semantic image figures and safe links.

## Admin endpoints

### `GET /api/admin/posts?status=draft&cursor=…`

Returns a paginated post list for the admin UI. Default order is `updated_at DESC`.

### `POST /api/admin/posts`

Creates a draft. Required fields: `title`, `categoryId`, and `contentJson`. `slug` may be omitted; the server creates it from the title and rejects conflicts.

```json
{
  "title": "D1으로 블로그를 설계한 이유",
  "summary": "관리자 중심 블로그의 데이터 모델을 정리한다.",
  "categoryId": "cat_tech",
  "tags": ["cloudflare"],
  "contentJson": { "type": "doc", "content": [{ "type": "paragraph" }] },
  "coverImageUrl": null
}
```

The current admin UI sends tag names. The repository creates a reusable `tags` row when needed and atomically replaces that post's `post_tags` relationships. The API response always returns `tags` as names.

### `GET /api/admin/posts/:id`

Returns a single post including the editable `contentJson` document and tag IDs.

### `PATCH /api/admin/posts/:id`

Updates a draft or published post. The server updates `updated_at`, regenerates `content_text` when `contentJson` changes, and preserves the existing `published_at` value.

### `POST /api/admin/posts/:id/publish`

Validates all required public fields, changes `status` to `published`, and sets `published_at` if it was empty.

### `POST /api/admin/posts/:id/archive`

Changes `status` to `archived`; no hard deletion is provided in v1.

## Public rendering

`/`와 `/posts`는 발행일 역순의 published 글 목록을, `/posts/:slug`는 하나의 published 글만 렌더링한다. 본문은 허용된 Tiptap JSON 노드·mark만 HTML로 변환하고 텍스트를 다시 escape한다. 공개 JSON API는 현재 제공하지 않는다.

## API implementation checklist

1. Define Zod schemas for every request and response.
2. Return `ApiResult<T>` from every endpoint, including all error paths.
3. Add a Tiptap allowlist and link/image URL validation before database writes.
4. Generate a collision-safe slug in a transaction-like write flow.
5. Use prepared statements and replace all post-tag relations atomically.
6. Add API tests for draft privacy, publish validation, slug conflicts, unsafe content, and union narrowing.
