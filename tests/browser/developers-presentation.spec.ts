import {test,expect} from '@playwright/test';
for(const width of [390,1440])test(`developer presentation remains usable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/developers');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Build on evidence.');
 await page.getByRole('link',{name:'Start with the CLI'}).click();await expect(page).toHaveURL(/#cli$/);
 await expect(page.getByRole('heading',{name:'Command line',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:/Inspect a lockfile offline/})).toHaveAttribute('href',/examples\/inspect-lockfile.mjs$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Switch to light mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
