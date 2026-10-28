import {test,expect} from '@playwright/test';

test('hero evidence and report navigation work without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 try{
  const page=await context.newPage();await page.goto('/');
  const panel=page.getByLabel('Public demo evidence');
  await expect(panel.getByRole('heading',{name:'Blocked',exact:true})).toBeVisible();
  await expect(panel.getByRole('link')).toHaveCount(4);
  await panel.getByRole('link',{name:'Open demo report'}).click();
  await expect(page).toHaveURL(/\/reports\/demo-recorded$/);
  await expect(page.locator('.report-row')).toHaveCount(5);
 }finally{await context.close();}
});
test('hero finding links open the matching recorded evidence',async({page})=>{
 await page.goto('/');
 const finding=page.getByLabel('Public demo evidence').locator('a[href*="/findings/"]').first();
 const href=await finding.getAttribute('href');
 expect(href).toMatch(/^\/reports\/demo-recorded\/findings\//);
 await finding.click();
 await expect(page).toHaveURL(url=>url.pathname===href);
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
});
for(const theme of ['light','dark'] as const)test(`reduced motion and static logo in ${theme}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce',colorScheme:theme});await page.goto('/');
 await expect(page.getByLabel('Public demo evidence')).toBeVisible();
 expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
 await expect(page.locator('header [data-shiptested-logo] path:not([data-logo-tick])').first()).toHaveCSS('opacity','1');
 await expect(page.locator('header [data-logo-tick]').first()).toHaveCSS('stroke-dashoffset','0px');
});
test('gated pages stay 403 and provide a branded next step',async({page})=>{const response=await page.goto('/sign-in');expect(response?.status()).toBe(403);await expect(page.getByRole('heading',{name:'Live features need a member workspace'})).toBeVisible();await expect(page.getByRole('link',{name:'View demo reports'})).toBeVisible();});
