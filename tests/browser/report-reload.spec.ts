import {test,expect} from '@playwright/test';
test('stable demo URLs survive reload and legacy views resolve to the report',async({page})=>{
 await page.goto('/?view=findings&report=demo-offline');
 await expect(page.getByRole('heading',{name:'Scan report',exact:true})).toBeVisible();
 await expect(page).toHaveURL(/reports\/demo-offline/);
 await page.getByRole('link',{name:/Command Injection in lodash/}).click();
 await page.reload();
 await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();
 await page.getByRole('button',{name:'Back to report'}).click();
 await expect(page.getByRole('heading',{name:'Scan report',exact:true})).toBeVisible();
});
test('inaccessible report has its own recovery screen',async({page})=>{
 await page.route('**/api/scans/missing',r=>r.fulfill({status:404,json:{error:'Unavailable'}}));
 await page.goto('/?view=overview&report=missing');
 await expect(page.getByRole('heading',{name:'Report unavailable'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Run the demo',exact:true})).toHaveCount(0);
});
test('finding Back restores its row and recorded replay has provenance',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/?report=demo-offline');
 const row=page.getByRole('link',{name:/Command Injection in lodash/});await row.click();await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();
 await page.getByRole('button',{name:'Back to report'}).click();await expect(row).toBeFocused();
 await page.goto('/?report=demo-recorded');await expect(page.getByText(/Recorded live run · captured/)).toBeVisible();await expect(page.locator('.research-sources')).not.toHaveAttribute('open','');await page.locator('.research-sources>summary').click();await expect(page.getByText('Tavily research · unconfirmed · never changes the verdict',{exact:true})).toBeVisible();
});
test('mobile unrated rows keep severity separate from title',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/?report=demo-recorded');const row=page.locator('.report-row').first();await expect(row).toBeVisible();const tag=await row.locator('.severity').boundingBox(),title=await row.locator('.finding-copy').boundingBox();expect(tag!.x+tag!.width).toBeLessThanOrEqual(title!.x);expect(await row.evaluate(e=>e.getBoundingClientRect().height)).toBeLessThanOrEqual(80);
});
