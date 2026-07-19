# Project conventions

## APIs

Every new or changed API endpoint must return a discriminated-union JSON response.

- Use `ok: true` with `data` for success and `ok: false` with `error` for failure.
- Error responses must use a stable `error.code`; validation failures include `error.fields`.
- Model the server response as `ApiResult<T>` in both server and client TypeScript.
- Keep HTTP status codes semantically correct, but never rely on status alone for client response narrowing.
- Update `docs/posts-api-contract.md` and the relevant Zod schemas/tests whenever an endpoint is added or changed.
