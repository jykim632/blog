import { error, json } from '../../_lib/api';
import { getPost } from '../repository';
import { postIdSchema } from '../schema';
interface Env { DB: D1Database; }
export const onRequestPost: PagesFunction<Env> = async ({ env, params }) => {
  const id = postIdSchema.safeParse(params.id); if (!id.success) return error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.');
  try { const post = await getPost(env.DB, id.data); if (!post) return error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.');
    const now = new Date().toISOString(); await env.DB.prepare("UPDATE posts SET status='published', published_at=COALESCE(published_at, ?1), updated_at=?1 WHERE id=?2").bind(now, id.data).run();
    return json({ ok: true, data: await getPost(env.DB, id.data) });
  } catch { return error(500, 'INTERNAL_ERROR', '글을 발행하지 못했습니다.'); }
};
