import type { z } from "zod";
import {
  contentJsonSchema,
  type postStatusSchema,
  type TiptapDocument,
  type TiptapNode,
} from "./schema";
import type { PublicPost } from "../../../../src/lib/posts/types";

type Status = z.infer<typeof postStatusSchema>;
type ContentJson = TiptapDocument;

export interface Category {
  id: string;
  name: string;
}
export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: Status;
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
}
export interface EditablePost extends PostListItem {
  contentJson: ContentJson;
  coverImageUrl: string | null;
}

type Row = Record<string, unknown>;

function tagsFrom(row: Row): string[] {
  return typeof row.tags === "string" && row.tags
    ? row.tags.split("\u001f")
    : [];
}

function listItem(row: Row): PostListItem {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    summary: String(row.summary),
    status: row.status as Status,
    categoryId: row.category_id ? String(row.category_id) : null,
    categoryName: row.category_name ? String(row.category_name) : null,
    tags: tagsFrom(row),
    publishedAt: row.published_at ? String(row.published_at) : null,
    updatedAt: String(row.updated_at),
  };
}

const listSql = `SELECT p.id, p.title, p.slug, p.summary, p.status, p.category_id, c.name AS category_name,
  p.content_json, p.cover_image_url, p.published_at, p.updated_at, GROUP_CONCAT(t.name, char(31)) AS tags
  FROM posts p LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN post_tags pt ON pt.post_id = p.id LEFT JOIN tags t ON t.id = pt.tag_id`;

export async function listCategories(db: D1Database): Promise<Category[]> {
  const result = await db
    .prepare("SELECT id, name FROM categories ORDER BY sort_order, name")
    .all<Category>();
  return result.results;
}

export async function listPosts(
  db: D1Database,
  status?: Status,
): Promise<PostListItem[]> {
  const where = status ? " WHERE p.status = ?1" : "";
  const result = await db
    .prepare(`${listSql}${where} GROUP BY p.id ORDER BY p.updated_at DESC`)
    .bind(...(status ? [status] : []))
    .all<Row>();
  return result.results.map(listItem);
}

export async function getPost(
  db: D1Database,
  id: string,
): Promise<EditablePost | null> {
  const result = await db
    .prepare(`${listSql} WHERE p.id = ?1 GROUP BY p.id`)
    .bind(id)
    .first<Row>();
  if (!result) return null;
  const parsed = contentJsonSchema.safeParse(
    JSON.parse(String(result.content_json ?? '{"type":"doc","content":[]}')),
  );
  if (!parsed.success) throw new Error("Stored post content is invalid.");
  return {
    ...listItem(result),
    contentJson: parsed.data,
    coverImageUrl: result.cover_image_url
      ? String(result.cover_image_url)
      : null,
  };
}

function publicPost(row: Row, includeContent = false): PublicPost {
  const publishedAt = row.published_at ? String(row.published_at) : null;
  if (!publishedAt) throw new Error("Published post is missing its publication date.");

  const post: PublicPost = {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    categoryName: row.category_name ? String(row.category_name) : null,
    tags: tagsFrom(row),
    publishedAt,
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
  };

  if (includeContent) {
    const content = contentJsonSchema.safeParse(JSON.parse(String(row.content_json ?? "{}")));
    if (!content.success) throw new Error("Stored post content is invalid.");
    post.contentJson = content.data;
  }

  return post;
}

export async function listPublishedPosts(db: D1Database): Promise<PublicPost[]> {
  const result = await db
    .prepare(`${listSql} WHERE p.status = 'published' GROUP BY p.id ORDER BY p.published_at DESC`)
    .all<Row>();
  return result.results.map((row) => publicPost(row));
}

export async function getPublishedPostBySlug(db: D1Database, slug: string): Promise<PublicPost | null> {
  const result = await db
    .prepare(`${listSql} WHERE p.status = 'published' AND p.slug = ?1 GROUP BY p.id`)
    .bind(slug)
    .first<Row>();
  return result ? publicPost(result, true) : null;
}

export function plainText(content: ContentJson): string {
  const collect = (node: TiptapNode): string[] => [
    node.text ?? "",
    ...(node.content?.flatMap(collect) ?? []),
  ];
  return content.content.flatMap(collect).filter(Boolean).join("\n").trim();
}

export function makeSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `post-${crypto.randomUUID().slice(0, 8)}`;
}

export async function slugAvailable(
  db: D1Database,
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM posts WHERE slug = ?1")
    .bind(slug)
    .first<{ id: string }>();
  return !row || row.id === exceptId;
}

export async function categoryExists(
  db: D1Database,
  id: string,
): Promise<boolean> {
  return Boolean(
    await db
      .prepare("SELECT id FROM categories WHERE id = ?1")
      .bind(id)
      .first(),
  );
}

export async function replaceTags(
  db: D1Database,
  postId: string,
  names: string[],
  now: string,
): Promise<void> {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const tagIds: string[] = [];
  for (const name of unique) {
    const slug = makeSlug(name);
    await db
      .prepare(
        "INSERT INTO tags (id, slug, name, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(name) DO NOTHING",
      )
      .bind(crypto.randomUUID(), slug, name, now)
      .run();
    const tag = await db
      .prepare("SELECT id FROM tags WHERE name = ?1")
      .bind(name)
      .first<{ id: string }>();
    if (tag) tagIds.push(tag.id);
  }
  await db.batch([
    db.prepare("DELETE FROM post_tags WHERE post_id = ?1").bind(postId),
    ...tagIds.map((tagId) =>
      db
        .prepare(
          "INSERT INTO post_tags (post_id, tag_id, created_at) VALUES (?1, ?2, ?3)",
        )
        .bind(postId, tagId, now),
    ),
  ]);
}
