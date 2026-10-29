import {expectVisibleBrand} from '../ui/brand-check';
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes=['/','/developers','/reports','/reports/demo-recorded','/scan','/hosts','/repairs','/team','/usage','/batches','/security-overview','/sign-in','/privacy','/security','/shared','/not-a-route'];
for(const theme of ['light','dark'] as const)for(const width of [1440,390])test(`page inventory: labelled icons, action styles and overflow at ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({colorScheme:theme});
 await page.addInitScript(t=>{localStorage.setItem("theme",t);localStorage.setItem("shipcheck-theme",t);},theme);
 await page.route('**/api/**',r=>r.fulfill({status:401,json:{error:'Sign in to continue'}}));
 for(const route of routes){
  await page.goto(route);await page.locator('h1').first().waitFor();await expectVisibleBrand(page);
  const issues=await page.locator('button:visible').evaluateAll(buttons=>buttons.flatMap(b=>{
   const name=b.getAttribute('aria-label')||b.textContent?.trim()||'';
   return [!b.querySelector('svg')?`Missing icon: ${name}`:'',!name?'Missing name':'',getComputedStyle(b).textDecorationLine.includes('underline')?`Underlined: ${name}`:''].filter(Boolean);
  }));expect(issues,route).toEqual([]);
  expect((await new AxeBuilder({page}).analyze()).violations,route).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);
 }
 await page.goto('/scan');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 await page.screenshot({path:`.private/ui-audit-scan-${width}-${theme}.png`,fullPage:true});
});
