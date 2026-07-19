import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequestGet, onRequestPatch } from '../../../../../functions/api/admin/posts/[id]';

const runtimeEnv = env as never;

export const GET: APIRoute = ({ request, params }) => onRequestGet({ request, params, env: runtimeEnv } as never);
export const PATCH: APIRoute = ({ request, params }) => onRequestPatch({ request, params, env: runtimeEnv } as never);
