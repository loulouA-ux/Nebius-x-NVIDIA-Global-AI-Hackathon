import {test,expect} from '@playwright/test';
for(const [width,height] of [[390,844],[1280,720],[1440,900]])test(`scan data and previews fit ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});
 await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));
 await page.goto('/scan');await page.getByRole('button',{name:'Offline fixture'}).click();
 await expect(page.getByRole('heading',{name:'Check coverage'})).toBeVisible();
 await expect(page.getByRole('status').filter({hasText:'3 of 3 findings'})).toBeVisible();
 await page.getByRole('heading',{name:'Check coverage'}).scrollIntoViewIfNeeded();await page.screenshot({path:`../outputs/shipcheck-data-previews/${width}-charts.png`});
 const csv=page.getByRole('button',{name:'Export CSV'});await csv.click();
 const dialog=page.getByRole('dialog',{name:'Findings CSV'});await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);
 await expect(dialog.getByRole('row')).toHaveCount(4);
 const download=page.waitForEvent('download');await dialog.getByRole('button',{name:'Download CSV'}).click();expect((await download).suggestedFilename()).toContain('-findings.csv');
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(csv).toBeFocused();

 await page.getByRole('link',{name:/Command Injection in lodash/}).click();await page.getByRole('button',{name:'Preview source'}).click();await expect(page.getByRole('dialog').last()).toContainText('Recorded excerpt');await expect(page.getByRole('link',{name:'Open original source in a new tab'})).toHaveAttribute('target','_blank');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`../outputs/shipcheck-data-previews/${width}-source.png`});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Back to report'}).click();await page.screenshot({path:`../outputs/shipcheck-data-previews/${width}-findings.png`});
});
