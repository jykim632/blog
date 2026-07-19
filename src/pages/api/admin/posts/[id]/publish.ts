import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequestPost } from '../../../../../../functions/api/admin/posts/[id]/publish';

const runtimeEnv = env as never;

export const POST: APIRoute = ({ request, params }) => onRequestPost({ request, params, env: runtimeEnv } as never);
