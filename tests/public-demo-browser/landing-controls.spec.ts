import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'] as const){test(`landing controls fit and link to real resources in ${theme}`,async({page},info)=>{
 await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
 for(const width of [360,390,800,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('/');
  const source=page.getByRole('navigation',{name:'Main',exact:true}).getByRole('link',{name:'GitHub',exact:true});
  await expect(source).toHaveAttribute('href','https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/tree/main');
  await expect(source.locator('svg')).toHaveCount(1);
  await expect(page.getByRole('navigation',{name:'Main'}).getByRole('link',{name:'Developers'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width<=600)await expect(page.locator('header').getByRole('link',{name:'Run the demo'})).toBeHidden();
  const size=await source.boundingBox();expect(size!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:info.outputPath(`landing-${theme}-${width}.png`),fullPage:true});
 }
});}
