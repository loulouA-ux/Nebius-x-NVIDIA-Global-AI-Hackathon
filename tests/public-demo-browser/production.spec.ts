import {test,expect} from '@playwright/test';
test('replay renders on the server and scripts carry nonces',async({request,page})=>{
 const response=await request.get('/reports/demo-recorded');const html=await response.text();expect(html).toContain('Regular Expression Denial');expect(html).toContain('Recorded live run');
 const csp=response.headers()['content-security-policy'];expect(csp).toContain("frame-ancestors 'none'");expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
 const violations:string[]=[];page.on('console',m=>{if(m.type()==='error'&&/Content Security Policy/.test(m.text()))violations.push(m.text());});
 await page.goto('/');await page.getByRole('button',{name:'Switch to light mode'}).or(page.getByRole('button',{name:'Switch to dark mode'})).click();expect(violations).toEqual([]);
 for(const path of ['/privacy','/security','/robots.txt','/sitemap.xml','/.well-known/security.txt','/opengraph-image'])expect((await request.get(path)).status()).toBe(200);
 expect((await request.get('/unknown-page')).status()).toBe(404);
});
