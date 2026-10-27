import {test,expect} from '@playwright/test';
test('hero is a complete server rendered picture without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('/');await expect(page.locator('.voyage')).toHaveAttribute('data-step','5');await expect(page.locator('.voyage-desktop .voyage-stamp')).toBeVisible();await expect(page.locator('.voyage-desktop [data-buoy][data-done="true"]')).toHaveCount(5);await context.close();
});
test('hero plays once, moments come after arrival, replay is explicit',async({page})=>{
 await page.goto('/');const scene=page.locator('.voyage');await expect(scene).toHaveAttribute('data-playing','true');await expect(scene.locator('.voyage-moment')).toHaveCount(0);
 await expect(scene.locator('.voyage-moment').first()).toBeVisible({timeout:5000});expect(await scene.locator('.voyage-moment').count()).toBeLessThanOrEqual(2);
 await expect(scene).toHaveAttribute('data-arrived','true',{timeout:10000});await page.reload();await expect(scene).toHaveAttribute('data-playing','false');await page.getByRole('button',{name:'Replay voyage'}).click();await expect(scene).toHaveAttribute('data-playing','true');
});
for(const theme of ['light','dark'] as const)test(`reduced motion and static logo in ${theme}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce',colorScheme:theme});await page.goto('/');await expect(page.locator('.voyage')).toHaveAttribute('data-arrived','true');expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);await expect(page.locator('.voyage-moment')).toHaveCount(0);await expect(page.locator('header [data-shiptested-logo] path:not([data-logo-tick])').first()).toHaveCSS('opacity','1');await expect(page.locator('header [data-logo-tick]').first()).toHaveCSS('stroke-dashoffset','0px');
});
test('gated pages stay 403 and provide a branded next step',async({page})=>{const response=await page.goto('/sign-in');expect(response?.status()).toBe(403);await expect(page.getByRole('heading',{name:'Live features need a member workspace'})).toBeVisible();await expect(page.getByRole('link',{name:'View demo reports'})).toBeVisible();});
