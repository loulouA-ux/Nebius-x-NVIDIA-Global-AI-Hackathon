import {describe,it,expect} from 'vitest';
import {safeReturnTo,signInHref,returnCookie,readReturnCookie} from '../src/lib/auth-navigation';
describe('authentication return destinations',()=>{
 it.each(['/repairs','/security-overview','/reports/abc-123','/batches'])('retains workspace destination %s',path=>expect(safeReturnTo(path)).toBe(path));
 it.each(['https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','/api/session','/sign-in','/reports?token=secret','/reports\r\nLocation: evil','/reports/../api/session'])('rejects unsafe destination %s',path=>expect(safeReturnTo(path)).toBe('/reports'));
 it('encodes a workspace return path without including query data',()=>{expect(signInHref('/repairs')).toBe('/sign-in?next=%2Frepairs');expect(signInHref('/reports')).toBe('/sign-in');});
 it('bounds the return cookie to the OAuth flow',()=>{const cookie=returnCookie('/repairs',true);expect(cookie).toContain('HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=600; Secure');expect(readReturnCookie(cookie)).toBe('/repairs');expect(returnCookie('/repairs',true,true)).toContain('Max-Age=0');});
 it('rejects duplicate and malformed return cookies',()=>{expect(readReturnCookie('shiptested_auth_return=%xx')).toBe('/reports');expect(readReturnCookie('shiptested_auth_return=%2Frepairs; shiptested_auth_return=%2Fscan')).toBe('/reports');});
});
