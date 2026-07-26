import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listPublishedPosts } from '../../functions/api/admin/posts/repository';

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);
}

export const GET: APIRoute = async ({ url }) => {
  const db = (env as never as { DB: Parameters<typeof listPublishedPosts>[0] }).DB;
  const posts = await listPublishedPosts(db);
  const siteUrl = url.origin;
  const items = posts.map((post) => {
    const postUrl = `${siteUrl}/posts/${post.slug}`;
    return `<item><title>${escapeXml(post.title)}</title><link>${postUrl}</link><guid isPermaLink="true">${postUrl}</guid><description>${escapeXml(post.summary)}</description><pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate></item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>파랑새들의 둥지</title><link>${siteUrl}</link><description>일과 기술, 그리고 오래 붙잡고 싶은 장면을 기록합니다.</description><language>ko</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
