import {expectVisibleBrand} from '../ui/brand-check';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readdirSync} from 'node:fs';
const docs=readdirSync('apps/docs/content/docs').filter(f=>f.endsWith('.mdx')).map(f=>'/docs'+(f==='index.mdx'?'':'/'+f.replace('.mdx','')));
for(const theme of ['light','dark'] as const)for(const width of [1440,390])test(`platform pages at ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({colorScheme:theme});
 await page.addInitScript(t=>{localStorage.setItem("theme",t);localStorage.setItem("shipcheck-theme",t);},theme);
 await page.route('**/api/status',r=>r.fulfill({json:{mcp:'Not checked in UI fixture',sites:{},packages:{}}}));
 for(const [port,paths]of [[3181,docs],[3182,['/','/releases']],[3180,['/']]] as const){
  for(const path of paths){
   const response=await page.goto(`http://127.0.0.1:${port}${path}`);expect(response?.status(),path).toBe(200);
   await page.locator('h1').first().waitFor();await expectVisibleBrand(page);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${port}${path}`).toBe(true);
   const issues=await page.locator('button:visible').evaluateAll(bs=>bs.filter(b=>!b.querySelector('svg')).map(b=>b.textContent));
   expect(issues,`${port}${path}`).toEqual([]);
   expect((await new AxeBuilder({page}).analyze()).violations,`${port}${path}`).toEqual([]);
  }
  await page.screenshot({path:`.private/platform-${port}-${width}-${theme}.png`,fullPage:true});
 }
});
