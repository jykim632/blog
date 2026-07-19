import { error, json } from '../_lib/api';
import { allowedImageTypes, mediaAltTextSchema, mediaFilenameSchema, mediaSearchSchema, type AllowedImageType } from './schema';

interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  MEDIA_PUBLIC_URL: string;
}

interface MediaAsset {
  id: string;
  objectKey: string;
  publicUrl: string;
  originalFilename: string;
  altText: string;
  contentType: string;
  bytes: number;
  createdAt: string;
  updatedAt: string;
}

const maxUploadBytes = 10 * 1024 * 1024;

function toMediaAsset(row: Record<string, unknown>): MediaAsset {
  return {
    id: String(row.id),
    objectKey: String(row.object_key),
    publicUrl: String(row.public_url),
    originalFilename: String(row.original_filename),
    altText: String(row.alt_text),
    contentType: String(row.content_type),
    bytes: Number(row.bytes),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const parsedSearch = mediaSearchSchema.safeParse(url.searchParams.get('q') ?? '');
    if (!parsedSearch.success) {
      return error(400, 'VALIDATION_ERROR', '검색어를 확인해 주세요.', { q: '100자 이하로 입력해 주세요.' });
    }
    const cursor = url.searchParams.get('cursor') ?? '';
    const search = parsedSearch.data;
    const statement = env.DB.prepare(
      `SELECT id, object_key, public_url, original_filename, alt_text, content_type, bytes, created_at, updated_at
       FROM media_assets
       WHERE (?1 = '' OR original_filename LIKE ?2 OR alt_text LIKE ?2)
         AND (?3 = '' OR created_at < ?3)
       ORDER BY created_at DESC
       LIMIT 49`,
    ).bind(search, `%${search}%`, cursor);
    const result = await statement.all<Record<string, unknown>>();
    const items = result.results.slice(0, 48).map(toMediaAsset);
    return json({ ok: true, data: { items, nextCursor: result.results.length > 48 ? items.at(-1)?.createdAt ?? null : null } });
  } catch {
    return error(500, 'INTERNAL_ERROR', '이미지 목록을 불러오지 못했습니다.');
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, 'VALIDATION_ERROR', '업로드 요청을 읽지 못했습니다.', { file: '이미지 파일을 다시 선택해 주세요.' });
  }
  const candidate = form.get('file');
  if (!(candidate instanceof File)) {
    return error(400, 'VALIDATION_ERROR', '업로드할 이미지 파일을 선택해 주세요.', { file: '이미지 파일이 필요합니다.' });
  }
  if (!(candidate.type in allowedImageTypes)) {
    return error(400, 'VALIDATION_ERROR', 'JPG, PNG, WebP, GIF, AVIF 이미지만 업로드할 수 있습니다.', { file: '지원하지 않는 이미지 형식입니다.' });
  }
  if (candidate.size === 0 || candidate.size > maxUploadBytes) {
    return error(400, 'VALIDATION_ERROR', '이미지 크기는 10MB 이하여야 합니다.', { file: '이미지 크기를 확인해 주세요.' });
  }
  const parsedAlt = mediaAltTextSchema.safeParse(form.get('alt') ?? '');
  if (!parsedAlt.success) {
    return error(400, 'VALIDATION_ERROR', '대체 텍스트를 확인해 주세요.', { alt: '240자 이하로 입력해 주세요.' });
  }
  const filenameValue = form.get('filename');
  const parsedFilename = mediaFilenameSchema.safeParse(typeof filenameValue === 'string' && filenameValue.trim() ? filenameValue : candidate.name);
  if (!parsedFilename.success) {
    return error(400, 'VALIDATION_ERROR', '파일 이름을 확인해 주세요.', { filename: '파일 이름은 1~180자여야 합니다.' });
  }
  if (!env.MEDIA_PUBLIC_URL) return error(503, 'MEDIA_CONFIGURATION_ERROR', '이미지 저장소 설정이 완료되지 않았습니다.');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const datePath = now.slice(0, 7).replace('-', '/');
  const extension = allowedImageTypes[candidate.type as AllowedImageType];
  const objectKey = `posts/${datePath}/${id}.${extension}`;
  const publicUrl = `${env.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${objectKey}`;

  try {
    await env.MEDIA_BUCKET.put(objectKey, await candidate.arrayBuffer(), {
      httpMetadata: { contentType: candidate.type, cacheControl: 'public, max-age=31536000, immutable' },
    });
    await env.DB.prepare(
      `INSERT INTO media_assets (id, object_key, public_url, original_filename, alt_text, content_type, bytes, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)`,
    ).bind(id, objectKey, publicUrl, parsedFilename.data, parsedAlt.data, candidate.type, candidate.size, now).run();
  } catch {
    await env.MEDIA_BUCKET.delete(objectKey).catch(() => undefined);
    return error(500, 'INTERNAL_ERROR', '이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  return json({ ok: true, data: { id, objectKey, publicUrl, originalFilename: parsedFilename.data, altText: parsedAlt.data, contentType: candidate.type, bytes: candidate.size, createdAt: now, updatedAt: now } }, 201);
};
