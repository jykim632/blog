import { error, json } from '../_lib/api';
import { categoryExists, getPost, makeSlug, plainText, replaceTags, slugAvailable } from './repository';
import { postIdSchema, updatePostSchema } from './schema';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = postIdSchema.safeParse(params.id); if (!id.success) return error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.');
  try { const post = await getPost(env.DB, id.data); return post ? json({ ok: true, data: post }) : error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.'); }
  catch { return error(500, 'INTERNAL_ERROR', '글을 불러오지 못했습니다.'); }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = postIdSchema.safeParse(params.id); const input = updatePostSchema.safeParse(await request.json().catch(() => null));
  if (!id.success) return error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.');
  if (!input.success) return error(400, 'VALIDATION_ERROR', '입력 내용을 확인해 주세요.', { form: input.error.issues[0]?.message ?? '수정할 내용을 입력해 주세요.' });
  try {
    const existing = await getPost(env.DB, id.data); if (!existing) return error(404, 'NOT_FOUND', '글을 찾을 수 없습니다.');
    const next = { ...existing, ...input.data };
    if (input.data.categoryId && !(await categoryExists(env.DB, input.data.categoryId))) return error(400, 'VALIDATION_ERROR', '카테고리를 확인해 주세요.', { categoryId: '존재하는 카테고리를 선택해 주세요.' });
    const slug = existing.status === 'published' ? existing.slug : (input.data.slug ?? (input.data.title ? makeSlug(input.data.title) : existing.slug));
    if (!(await slugAvailable(env.DB, slug, id.data))) return error(409, 'SLUG_CONFLICT', '이미 사용 중인 주소입니다.');
    const now = new Date().toISOString(); const content = input.data.contentJson ?? existing.contentJson;
    await env.DB.prepare('UPDATE posts SET category_id=?1, slug=?2, title=?3, summary=?4, content_json=?5, content_text=?6, cover_image_url=?7, updated_at=?8 WHERE id=?9')
      .bind(next.categoryId, slug, next.title, next.summary, JSON.stringify(content), plainText(content), next.coverImageUrl ?? null, now, id.data).run();
    if (input.data.tags) await replaceTags(env.DB, id.data, input.data.tags, now);
    return json({ ok: true, data: await getPost(env.DB, id.data) });
  } catch { return error(500, 'INTERNAL_ERROR', '글을 저장하지 못했습니다.'); }
};
