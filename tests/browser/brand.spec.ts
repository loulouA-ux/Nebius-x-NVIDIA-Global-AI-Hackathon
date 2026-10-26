import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
for(const theme of ['dark','light'] as const)test(`tick-only accent and brand copy in ${theme}`,async({page,request})=>{
 await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await page.goto('/');
 const mark=page.locator('header [data-shipcheck-logo]').first();const colors=await mark.evaluate(el=>{const root=getComputedStyle(document.documentElement);return {accent:root.getPropertyValue('--accent').trim(),paths:[...el.querySelectorAll('path')].map(p=>({tick:p.hasAttribute('data-logo-tick'),stroke:getComputedStyle(p).stroke}))};});
 expect(new Set(colors.paths.filter(p=>!p.tick).map(p=>p.stroke)).size).toBe(1);expect(colors.paths.find(p=>p.tick)!.stroke).not.toBe(colors.paths.find(p=>!p.tick)!.stroke);
 await expect(mark.locator('[data-logo-tick]')).toHaveCSS('stroke',theme==='dark'?'rgb(94, 234, 212)':'rgb(15, 118, 110)');
 for(const path of ['/brand/favicon.svg','/brand/app-icon.svg','/manifest.webmanifest'])expect((await request.get(path)).ok()).toBe(true);
 const manifest=await (await request.get('/manifest.webmanifest')).json();expect(manifest.icons[0].src).toBe('/brand/app-icon.svg');
 await page.goto('/reports/demo-recorded');await expect(page.getByText('5 findings need a person to decide.',{exact:true})).toBeVisible();
 const durations=await page.locator('*').evaluateAll(els=>els.flatMap(e=>{const s=getComputedStyle(e);return [s.animationDuration,s.transitionDuration].flatMap(v=>v.split(',').map(x=>parseFloat(x)*1000));}));expect(Math.max(...durations)).toBeLessThanOrEqual(1);
});
test('member empty state uses brand copy',async({page})=>{await page.route('**/api/scans',r=>r.fulfill({json:{scans:[]}}));await page.goto('/reports');await expect(page.getByText("No reports yet — Scan a lockfile to see what you're about to ship.",{exact:false})).toBeVisible();});
test('presentation copy has no retired promises',()=>{function files(dir:string):string[]{return readdirSync(dir).flatMap(name=>{const p=join(dir,name);return statSync(p).isDirectory()?files(p):p.endsWith('.tsx')?[p]:[];});}const source=files('src/app').filter(p=>!p.includes('/api/')).map(p=>readFileSync(p,'utf8')).join('\n');expect(source).not.toMatch(/Ship without the surprise CVE|\bsecure\b|guaranteed|auto-fix/i);});
