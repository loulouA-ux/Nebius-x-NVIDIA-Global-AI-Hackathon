import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
for(const theme of ['light','dark'] as const)for(const width of [1440,390])test(`rebrand captures ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:width===1440?900:844});await page.emulateMedia({colorScheme:theme});
 await mkdir('docs/design-handoff-review/rebrand',{recursive:true});
 for(const [name,path] of [['landing','/'],['report','/reports/demo-recorded'],['sign-in','/sign-in']]){
 await page.goto(path);await expect(page.locator('h1')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 if(name==='report')await expect(page.locator('.report-row').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/design-handoff-review/rebrand/${theme}-${name}-${width}.png`,fullPage:true});
 }
});
