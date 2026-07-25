# Media API contract

`/api/admin/media/*` is a Cloudflare Access-protected API for the image manager. It is never public.

## Storage model

- R2 bucket: image bytes, stored as `posts/YYYY/MM/<uuid>.<extension>`.
- D1 `media_assets`: original filename, public URL, alt text, content type, byte size, and timestamps.
- Public delivery domain: `https://media.bluebirds.cloud`.

The browser never receives R2 credentials. Pages Functions use the `MEDIA_BUCKET` binding.

## Authentication

Every request requires a valid Cloudflare Access JWT. Configure the following runtime values after creating the Access application:

- `MEDIA_ACCESS_TEAM_DOMAIN`: `https://long-disk-2ff5.cloudflareaccess.com`
- `MEDIA_ACCESS_AUD`: the Audience (AUD) value for the Self-hosted Access application (include both production and development admin hostnames in that application)
- `MEDIA_ACCESS_EMAIL`: the permitted administrator email address
- `MEDIA_PUBLIC_URL`: `https://media.bluebirds.cloud`

The API returns `503 AUTH_CONFIGURATION_ERROR` until Access is configured, rather than accepting anonymous requests.
The same middleware also protects `/admin/*`, so the management UI is never served without a valid Access session.

## Response envelope

Every endpoint returns:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/media?q=&cursor=` | List up to 48 images, newest first. |
| `POST` | `/api/admin/media` | Upload `file` plus optional `filename` and `alt` multipart fields. Allows JPG, PNG, WebP, GIF, AVIF up to 10MB. |
| `PATCH` | `/api/admin/media/:id` | Update `{ alt?, filename? }`. Filename updates D1 metadata only; the R2 object key and public URL remain unchanged. |
| `DELETE` | `/api/admin/media/:id` | Delete the R2 object and its D1 record. |

Expected error codes include `UNAUTHENTICATED`, `AUTH_CONFIGURATION_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND`, `MEDIA_CONFIGURATION_ERROR`, and `INTERNAL_ERROR`.
