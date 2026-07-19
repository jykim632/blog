import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequestGet, onRequestPost } from '../../../../../functions/api/admin/posts/index';

const runtimeEnv = env as never;

export const GET: APIRoute = ({ request, params }) => onRequestGet({ request, params, env: runtimeEnv } as never);
export const POST: APIRoute = ({ request, params }) => onRequestPost({ request, params, env: runtimeEnv } as never);
