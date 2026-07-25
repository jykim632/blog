import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { getAccessLoginUrl, shouldBypassLocalAdmin, verifyAccess } from '../functions/api/admin/_lib/access';

const accessEnv = env as {
  MEDIA_ACCESS_AUD?: string;
  LOCAL_ADMIN_BYPASS?: string;
  MEDIA_ACCESS_EMAIL?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return next();

  if (shouldBypassLocalAdmin(context.request, accessEnv)) return next();

  const rejected = await verifyAccess(context.request, accessEnv);
  if (!rejected) return next();

  const acceptsHtml = context.request.headers.get('Accept')?.includes('text/html');
  if (pathname.startsWith('/admin') && rejected.status === 401 && acceptsHtml) {
    const loginUrl = getAccessLoginUrl(context.request, accessEnv);
    if (loginUrl) return Response.redirect(loginUrl, 302);
  }

  return rejected;
});
