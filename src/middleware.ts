import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { verifyAccess } from '../functions/api/admin/_lib/access';

const accessEnv = env as {
  MEDIA_ACCESS_EMAIL?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return next();
  return (await verifyAccess(context.request, accessEnv)) ?? next();
});
