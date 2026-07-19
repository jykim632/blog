import { error, json } from '../_lib/api';
import { categoryExists, getPost, listCategories, listPosts, makeSlug, plainText, replaceTags, slugAvailable } from './repository';
import { createPostSchema, postStatusSchema } from './schema';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const status = new URL(request.url).searchParams.get('status');
  const parsed = status ? postStatusSchema.safeParse(status) : undefined;
  if (status && !parsed?.success) return error(400, 'VALIDATION_ERROR', '글 상태를 확인해 주세요.', { status: 'draft, published, archived 중 하나여야 합니다.' });
  try { return json({ ok: true, data: { items: await listPosts(env.DB, parsed?.data), categories: await listCategories(env.DB) } }); }
  catch { return error(500, 'INTERNAL_ERROR', '글 목록을 불러오지 못했습니다.'); }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) return error(400, 'VALIDATION_ERROR', '입력 내용을 확인해 주세요.', { form: parsed.error.issues[0]?.message ?? '필수 항목을 입력해 주세요.' });
  const input = parsed.data;
  if (!(await categoryExists(env.DB, input.categoryId))) return error(400, 'VALIDATION_ERROR', '카테고리를 확인해 주세요.', { categoryId: '존재하는 카테고리를 선택해 주세요.' });
  const slug = input.slug ?? makeSlug(input.title);
  if (!(await slugAvailable(env.DB, slug))) return error(409, 'SLUG_CONFLICT', '이미 사용 중인 주소입니다.');
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  try {
    await env.DB.prepare('INSERT INTO posts (id, category_id, slug, title, summary, content_json, content_text, cover_image_url, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, \'draft\', ?9, ?9)')
      .bind(id, input.categoryId, slug, input.title, input.summary, JSON.stringify(input.contentJson), plainText(input.contentJson), input.coverImageUrl ?? null, now).run();
    await replaceTags(env.DB, id, input.tags, now);
    return json({ ok: true, data: await getPost(env.DB, id) }, 201);
  } catch { return error(500, 'INTERNAL_ERROR', '글을 저장하지 못했습니다.'); }
};
