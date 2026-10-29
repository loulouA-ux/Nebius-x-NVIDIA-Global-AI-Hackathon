/** Public synthetic demo only. Start a local production server before running. */
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const origin=process.env.SCREENSHOT_ORIGIN??'http://127.0.0.1:3151';
if(new URL(origin).hostname!=='127.0.0.1')throw Error('Use a local server; never capture private live reports.');
const output='docs/screenshots';await mkdir(output,{recursive:true});
const browser=await chromium.launch();
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(t=>localStorage.setItem('shipcheck-theme',t),theme);
  for(const [name,path] of [['landing','/'],['developers','/developers'],['report','/reports/demo-recorded']]){
   await page.goto(origin+path);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   if(name==='landing')await page.getByLabel('Public demo evidence').getByText('Recorded result').waitFor();
   await page.screenshot({path:`${output}/${name}-${theme}.png`,fullPage:false});
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow: ${name}/${theme}`);
  }
  await context.close();
 }
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});const page=await mobile.newPage();
 for(const [name,path] of [['landing','/'],['developers','/developers']]){await page.goto(origin+path);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${output}/${name}-mobile.png`,fullPage:true});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Mobile overflow: ${name}`);}
 await mobile.close();console.log('Captured eight public-demo screenshots; desktop and mobile overflow checks passed.');
}finally{await browser.close();}
