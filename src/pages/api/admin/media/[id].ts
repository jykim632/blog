import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRequestDelete, onRequestPatch } from '../../../../../functions/api/admin/media/[id]';

const runtimeEnv = env as never;

export const PATCH: APIRoute = ({ request, params }) => onRequestPatch({ request, params, env: runtimeEnv } as never);
export const DELETE: APIRoute = ({ request, params }) => onRequestDelete({ request, params, env: runtimeEnv } as never);
