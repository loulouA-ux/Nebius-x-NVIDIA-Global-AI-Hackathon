import {test,expect} from '@playwright/test';
test('legacy links redirect and findings support new tabs, reload and Back',async({page,context})=>{
 await page.goto('/?view=findings&report=demo-offline');await expect(page).toHaveURL(/\/reports\/demo-offline$/);
 const row=page.getByRole('link',{name:/Command Injection in lodash/});await expect(row).toBeVisible();
 const href=await row.getAttribute('href');const other=await context.newPage();await other.goto(href!);await expect(other.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();await other.reload();await expect(other.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();await other.close();
 await row.click();await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeFocused();await page.goBack();await expect(row).toBeVisible();await page.goForward();await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();
 await page.goto('/?view=scan');await expect(page).toHaveURL(/\/scan$/);await page.goto('/?view=project');await expect(page).toHaveURL(/\/hosts$/);await page.goto('/?view=overview');await expect(page).toHaveURL(/\/reports$/);
});
test('phone provides primary tabs and remaining destinations through More',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/scan');const nav=page.getByRole('navigation',{name:'Main navigation'}).filter({visible:true});for(const name of ['Reports','Scan','Repairs'])await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();await nav.locator('summary').click();await nav.getByRole('link',{name:'Staging hosts',exact:true}).click();await expect(page).toHaveURL(/\/hosts$/);await expect(page.getByRole('heading',{name:'Staging hosts',exact:true})).toBeVisible();await nav.locator('summary').click();await expect(nav.getByRole('link',{name:'Staging hosts',exact:true})).toHaveAttribute('aria-current','page');});

test('phone findings hide desktop column headings', async ({page}) => {
 await page.setViewportSize({width:390,height:844});await page.goto('/reports/demo-offline');
 await expect(page.locator('.report-row').first()).toBeVisible();await expect(page.locator('.table-heading')).toBeHidden();
});
