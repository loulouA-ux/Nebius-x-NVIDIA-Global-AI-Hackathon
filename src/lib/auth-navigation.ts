// Only workspace destinations may be used after authentication. Never redirect to
// external URLs, API handlers, or arbitrary query parameters supplied by a link.
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || value.length > 500 || /[\\%\s?#]/.test(value)) return '/reports';
  return /^\/(?:reports(?:\/[a-zA-Z0-9-]+)?|scan|hosts|repairs|team|usage|batches|security-overview)$/.test(value) ? value : '/reports';
}
export function signInHref(path: string) {
  const next = safeReturnTo(path);
  return next === '/reports' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`;
}
export const AUTH_RETURN_COOKIE = 'shiptested_auth_return';
export function returnCookie(path: string, secure: boolean, clear = false) {
  return `${AUTH_RETURN_COOKIE}=${clear ? '' : encodeURIComponent(safeReturnTo(path))}; HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=${clear ? 0 : 600}${secure ? '; Secure' : ''}`;
}
export function readReturnCookie(cookie: string) {
  const values = cookie.split(';').map(v => v.trim()).filter(v => v.startsWith(`${AUTH_RETURN_COOKIE}=`));
  if (values.length !== 1) return '/reports';
  try { return safeReturnTo(decodeURIComponent(values[0].slice(AUTH_RETURN_COOKIE.length + 1))); }
  catch { return '/reports'; }
}
