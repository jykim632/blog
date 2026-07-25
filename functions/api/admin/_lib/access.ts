import { error } from './api';

type AccessJwk = JsonWebKey & { kid?: string };

interface AccessEnvironment {
  MEDIA_ACCESS_AUD?: string;
  MEDIA_ACCESS_EMAIL?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
}

export function shouldBypassLocalAdmin(request: Request, env: AccessEnvironment): boolean {
  const clientAddress = request.headers.get('cf-connecting-ip');
  if (clientAddress === '127.0.0.1' || clientAddress === '::1') return true;

  const hostname = request.headers.get('Host')?.split(':', 1)[0] ?? new URL(request.url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

interface AccessLoginEnvironment {
  MEDIA_ACCESS_AUD?: string;
  MEDIA_ACCESS_TEAM_DOMAIN?: string;
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

export async function verifyAccess(request: Request, env: AccessEnvironment): Promise<Response | null> {
  if (!env.MEDIA_ACCESS_AUD || !env.MEDIA_ACCESS_EMAIL || !env.MEDIA_ACCESS_TEAM_DOMAIN) {
    return error(503, 'AUTH_CONFIGURATION_ERROR', '관리자 인증 설정이 완료되지 않았습니다.');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return error(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');

  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return error(401, 'UNAUTHENTICATED', '유효하지 않은 인증 정보입니다.');
  }

  try {
    const header = decodeJson<{ alg?: string; kid?: string }>(encodedHeader);
    const payload = decodeJson<{ aud?: string | string[]; email?: string; exp?: number; iss?: string }>(encodedPayload);
    const accessDomain = env.MEDIA_ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (
      header.alg !== 'RS256'
      || !header.kid
      || !audience.includes(env.MEDIA_ACCESS_AUD)
      || !payload.exp
      || payload.exp * 1000 <= Date.now()
      || payload.iss !== accessDomain
      || payload.email?.toLowerCase() !== env.MEDIA_ACCESS_EMAIL.toLowerCase()
    ) {
      return error(401, 'UNAUTHENTICATED', '만료되었거나 유효하지 않은 인증 정보입니다.');
    }

    const certificateUrl = `${accessDomain}/cdn-cgi/access/certs`;
    const certificates = await fetch(certificateUrl).then(async (response) => {
      if (!response.ok) throw new Error('Could not load Access certificates.');
      return response.json() as Promise<{ keys: AccessJwk[] }>;
    });
    const jwk = certificates.keys.find((key) => key.kid === header.kid);
    if (!jwk) return error(401, 'UNAUTHENTICATED', '유효하지 않은 인증 정보입니다.');

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
    return valid ? null : error(401, 'UNAUTHENTICATED', '유효하지 않은 인증 정보입니다.');
  } catch {
    return error(401, 'UNAUTHENTICATED', '인증 정보를 확인할 수 없습니다.');
  }
}

export function getAccessLoginUrl(request: Request, env: AccessLoginEnvironment): string | null {
  if (!env.MEDIA_ACCESS_AUD || !env.MEDIA_ACCESS_TEAM_DOMAIN) return null;

  const requestUrl = new URL(request.url);
  const accessDomain = env.MEDIA_ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
  const loginUrl = new URL(`/cdn-cgi/access/login/${requestUrl.hostname}`, accessDomain);
  loginUrl.search = new URLSearchParams({
    kid: env.MEDIA_ACCESS_AUD,
    redirect_url: `${requestUrl.pathname}${requestUrl.search}`,
  }).toString();
  return loginUrl.toString();
}
