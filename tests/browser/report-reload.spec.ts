import {test,expect} from '@playwright/test';
test('stable demo URLs survive reload and legacy views resolve to the report',async({page})=>{
 await page.goto('/?view=findings&report=demo-offline');
 await expect(page.getByRole('heading',{name:'Scan report',exact:true})).toBeVisible();
 await expect(page).toHaveURL(/view=overview/);
 await page.getByRole('button',{name:/Command Injection in lodash/}).click();
 await page.reload();
 await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('heading',{name:'Scan report',exact:true})).toBeVisible();
});
test('inaccessible report has its own recovery screen',async({page})=>{
 await page.route('**/api/scans/missing',r=>r.fulfill({status:404,json:{error:'Unavailable'}}));
 await page.goto('/?view=overview&report=missing');
 await expect(page.getByRole('heading',{name:'Report unavailable'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Run the demo',exact:true})).toHaveCount(0);
});
