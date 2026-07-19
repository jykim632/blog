# Blog CMS database design (v1)

## Goal

The database is the source of truth for posts written in the Tiptap admin editor. The public site only exposes posts whose `status` is `published`.

## Data model

```text
categories 1 ─── * posts * ─── * tags
                         \     /
                          post_tags
```

| Table | Responsibility |
| --- | --- |
| `categories` | The one visible category selected in the current editor. |
| `posts` | Editable post and publishing state. |
| `tags` | Reusable, many-to-many keywords. |
| `post_tags` | Post/tag relationship. |

`db/migrations/0001_initial.sql` is the initial D1 migration.

## `posts` contract

| Field | Rule | Why |
| --- | --- | --- |
| `id` | App-generated UUID text | Avoids database-specific ID generation and makes a future PostgreSQL move simpler. |
| `slug` | Case-insensitive unique value | Becomes `/posts/:slug`. It must never change automatically after publishing. |
| `title` | 1–90 characters | Matches the current editor limit. |
| `summary` | Up to 240 characters | Used for cards, metadata, and social sharing. |
| `content_json` | Valid JSON | Canonical Tiptap `editor.getJSON()` output; this is what editing must read back. |
| `content_text` | Derived plain text | Generated on every save for reading time and later search. Never edit it directly. |
| `status` | `draft`, `published`, or `archived` | `draft` and `archived` must not be served publicly. |
| `published_at` | Required only for `published` | Defines public ordering, sitemap, and RSS dates. |

We deliberately do not store rendered HTML as the canonical content. It is generated from the allowed Tiptap JSON at render time, then sanitized. This avoids persisting stale or unsafe HTML.

## Save and publish rules

1. The admin editor sends `editor.getJSON()`, not `editor.getHTML()`.
2. The API validates permitted Tiptap nodes, marks, attributes, links, and image URLs.
3. The API derives `content_text`, estimates reading time, and writes `updated_at` in UTC ISO-8601 form.
4. A draft can omit `published_at`; publishing sets it once if it is missing.
5. A published post may be updated without changing its slug or original `published_at`.
6. Archiving hides the post from all public queries without deleting its data.

## Query rules

- Public home and post routes always filter with `status = 'published'`.
- Admin lists can filter by every status and sort drafts by `updated_at DESC`.
- Use the provided `status, published_at` index for public lists and RSS/sitemap generation.
- Use `slug` for public post lookup and never expose raw database IDs in URLs.

## Intentional v1 exclusions

- **Users and passwords:** authentication should be handled by Cloudflare Access/OAuth. Do not build a password table.
- **Post revisions:** add a `post_revisions` table when autosave history or rollback is a real product need; do not duplicate every draft write on day one.
- **Comments:** giscus remains external and needs no application table.
- **Images:** keep files in object storage later; the post stores only a URL/reference.

## PostgreSQL migration guardrails

- Keep UUIDs, timestamps, and JSON payloads application-generated/serialized.
- Keep all SQL behind a repository layer; routes must not call D1 directly.
- Avoid SQLite-only ID behavior such as `AUTOINCREMENT`.
- Recreate indexes and constraints in PostgreSQL, export tables as data, then import after a small SQL/type conversion.
