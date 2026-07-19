export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

export function json<T>(body: ApiResult<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function error(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): Response {
  return json({ ok: false, error: { code, message, ...(fields ? { fields } : {}) } }, status);
}
