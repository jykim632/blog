import { error, json } from '../_lib/api';
import { mediaAltTextSchema, mediaIdSchema } from './schema';

interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = mediaIdSchema.safeParse(params.id);
  const body = await request.json().catch(() => null);
  const alt = mediaAltTextSchema.safeParse(body?.alt);
  if (!id.success || !alt.success) {
    return error(400, 'VALIDATION_ERROR', '대체 텍스트를 확인해 주세요.', { alt: '240자 이하로 입력해 주세요.' });
  }
  try {
    const result = await env.DB.prepare('UPDATE media_assets SET alt_text = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(alt.data, new Date().toISOString(), id.data)
      .run();
    if (!result.meta.changes) return error(404, 'NOT_FOUND', '이미지를 찾을 수 없습니다.');
    return json({ ok: true, data: { id: id.data, altText: alt.data } });
  } catch {
    return error(500, 'INTERNAL_ERROR', '대체 텍스트를 저장하지 못했습니다.');
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = mediaIdSchema.safeParse(params.id);
  if (!id.success) return error(404, 'NOT_FOUND', '이미지를 찾을 수 없습니다.');
  try {
    const result = await env.DB.prepare('SELECT object_key FROM media_assets WHERE id = ?1').bind(id.data).first<{ object_key: string }>();
    if (!result) return error(404, 'NOT_FOUND', '이미지를 찾을 수 없습니다.');
    await env.MEDIA_BUCKET.delete(result.object_key);
    await env.DB.prepare('DELETE FROM media_assets WHERE id = ?1').bind(id.data).run();
    return json({ ok: true, data: { id: id.data } });
  } catch {
    return error(500, 'INTERNAL_ERROR', '이미지를 삭제하지 못했습니다.');
  }
};
