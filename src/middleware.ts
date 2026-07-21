import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { verifyAccess } from '../functions/api/admin/_lib/access';

const accessEnv = env as {
  LOCAL_ADMIN_BYPASS?: string;
  MEDIA_ACCESS_EMAIL?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return next();

  const isLocalRequest = context.url.hostname === 'localhost' || context.url.hostname === '127.0.0.1';
  if (isLocalRequest && accessEnv.LOCAL_ADMIN_BYPASS === 'true') return next();

  return (await verifyAccess(context.request, accessEnv)) ?? next();
});
