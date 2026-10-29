import {test,expect} from '@playwright/test';
for(const width of [390,1440])test(`handoff pages and deep links at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Check before you ship.');
 await expect(page.locator('main').getByRole('link',{name:'Run the demo',exact:true})).toHaveAttribute('href','/reports/demo-recorded');await page.locator('main').getByRole('link',{name:'Run the demo',exact:true}).click();
 await expect(page).toHaveURL(/\/reports\/demo-recorded$/);await expect(page.locator('.report-row')).toHaveCount(5);
 await page.locator('.report-row').first().click();await expect(page).toHaveURL(/\/findings\//);
 await page.reload();await expect(page.locator('h1')).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.goBack();await expect(page.locator('.report-row')).toHaveCount(5);
 for(const path of ['/reports','/scan','/hosts','/repairs','/sign-in']){await page.goto(path);await expect(page.locator('h1')).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto('/reports');await expect(page.locator('.saved-report-row')).toHaveCount(2);await page.getByLabel('Search reports').fill('demo-recorded');await expect(page.locator('.saved-report-row')).toHaveCount(1);
});
