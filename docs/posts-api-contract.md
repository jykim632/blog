# Posts API contract (v1)

This contract is the boundary between the future `/admin` app and D1. It should be implemented through a repository layer, not from Astro pages directly.

## Authentication and response rules

- `GET /api/posts/:slug` is public only when the post is published.
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

The API accepts a JSON document, validates the allowed node/mark set, serializes it into `posts.content_json`, and derives `content_text`. Clients never send rendered HTML as the stored source of truth.

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
  "tagIds": ["tag_cloudflare"],
  "contentJson": { "type": "doc", "content": [{ "type": "paragraph" }] },
  "coverImageUrl": null
}
```

### `GET /api/admin/posts/:id`

Returns a single post including the editable `contentJson` document and tag IDs.

### `PATCH /api/admin/posts/:id`

Updates a draft or published post. The server updates `updated_at`, regenerates `content_text` when `contentJson` changes, and preserves the existing `published_at` value.

### `POST /api/admin/posts/:id/publish`

Validates all required public fields, changes `status` to `published`, and sets `published_at` if it was empty.

### `POST /api/admin/posts/:id/archive`

Changes `status` to `archived`; no hard deletion is provided in v1.

## Public endpoints

### `GET /api/posts/:slug`

Returns a published post only. The response uses rendered, sanitized HTML for `contentHtml`, while the admin endpoint alone returns `contentJson`.

### `GET /api/posts?limit=…&cursor=…&category=…&tag=…`

Returns published card data only: title, slug, summary, cover image, category, tags, published date, and derived reading time.

## API implementation checklist

1. Define Zod schemas for every request and response.
2. Return `ApiResult<T>` from every endpoint, including all error paths.
3. Add a Tiptap allowlist and link/image URL validation before database writes.
4. Generate a collision-safe slug in a transaction-like write flow.
5. Use prepared statements and replace all post-tag relations atomically.
6. Add API tests for draft privacy, publish validation, slug conflicts, unsafe content, and union narrowing.
