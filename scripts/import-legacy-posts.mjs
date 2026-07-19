import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const postsDirectory = new URL('../src/content/posts/', import.meta.url);
const categoryFor = (category) => category.toLowerCase() === 'study' ? 'cat_tech' : 'cat_note';
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

function parsePost(source, filename) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: frontmatter를 읽지 못했습니다.`);
  const frontmatter = match[1];
  const body = match[2].trim();
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  const tags = [...frontmatter.matchAll(/^\s+-\s+(.+)$/gm)].map((tag) => tag[1].trim());
  const title = field('title');
  const summary = field('summary');
  const publishedAt = `${field('publishedAt')}T00:00:00.000Z`;
  const category = field('category');
  const slug = filename.replace(/\.md$/, '');
  const blocks = body.split(/\n{2,}/).filter(Boolean).map((text) => {
    const heading = text.match(/^#{1,3}\s+(.+)$/);
    return heading
      ? { type: 'heading', attrs: { level: Math.min(text.match(/^#+/)?.[0].length ?? 1, 3) }, content: [{ type: 'text', text: heading[1] }] }
      : { type: 'paragraph', content: [{ type: 'text', text }] };
  });
  return { id: randomUUID(), slug, title, summary, publishedAt, categoryId: categoryFor(category), tags, contentJson: { type: 'doc', content: blocks }, contentText: body };
}

const statements = [];
for (const filename of readdirSync(postsDirectory).filter((name) => name.endsWith('.md'))) {
  const post = parsePost(readFileSync(join(postsDirectory.pathname, filename), 'utf8'), filename);
  const now = new Date().toISOString();
  statements.push(`INSERT INTO posts (id, category_id, slug, title, summary, content_json, content_text, status, published_at, created_at, updated_at) VALUES (${sqlString(post.id)}, ${sqlString(post.categoryId)}, ${sqlString(post.slug)}, ${sqlString(post.title)}, ${sqlString(post.summary)}, ${sqlString(JSON.stringify(post.contentJson))}, ${sqlString(post.contentText)}, 'published', ${sqlString(post.publishedAt)}, ${sqlString(now)}, ${sqlString(now)}) ON CONFLICT(slug) DO NOTHING;`);
  for (const tag of post.tags) {
    const tagId = randomUUID();
    statements.push(`INSERT INTO tags (id, slug, name, created_at) VALUES (${sqlString(tagId)}, ${sqlString(`legacy-${tagId.slice(0, 8)}`)}, ${sqlString(tag)}, ${sqlString(now)}) ON CONFLICT(name) DO NOTHING;`);
    statements.push(`INSERT OR IGNORE INTO post_tags (post_id, tag_id, created_at) SELECT p.id, t.id, ${sqlString(now)} FROM posts p JOIN tags t ON t.name = ${sqlString(tag)} WHERE p.slug = ${sqlString(post.slug)};`);
  }
}

execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'blog', '--remote', '--command', statements.join('\n')], { stdio: 'inherit' });
