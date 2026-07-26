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
  const staticUrls = ['/', '/posts', '/about'];
  const urls = [
    ...staticUrls.map((path) => `<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`),
    ...posts.map((post) => `<url><loc>${escapeXml(`${siteUrl}/posts/${post.slug}`)}</loc><lastmod>${new Date(post.publishedAt).toISOString()}</lastmod></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
