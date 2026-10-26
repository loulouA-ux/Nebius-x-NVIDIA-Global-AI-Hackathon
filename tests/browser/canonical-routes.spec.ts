import {test,expect} from '@playwright/test';
test('legacy links redirect and findings support new tabs, reload and Back',async({page,context})=>{
 await page.goto('/?view=findings&report=demo-offline');await expect(page).toHaveURL(/\/reports\/demo-offline$/);
 const row=page.getByRole('link',{name:/Command Injection in lodash/});await expect(row).toBeVisible();
 const href=await row.getAttribute('href');const other=await context.newPage();await other.goto(href!);await expect(other.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();await other.reload();await expect(other.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();await other.close();
 await row.click();await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeFocused();await page.goBack();await expect(row).toBeVisible();await page.goForward();await expect(page.getByRole('heading',{name:/Command Injection in lodash/})).toBeVisible();
 await page.goto('/?view=scan');await expect(page).toHaveURL(/\/scan$/);await page.goto('/?view=project');await expect(page).toHaveURL(/\/hosts$/);await page.goto('/?view=overview');await expect(page).toHaveURL(/\/reports$/);
});
test('phone provides four direct tabs',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/scan');const nav=page.getByRole('navigation',{name:'Main navigation'});for(const name of ['Reports','Scan','Repairs','Hosts'])await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();await nav.getByRole('link',{name:'Hosts',exact:true}).click();await expect(nav.getByRole('link',{name:'Hosts',exact:true})).toHaveAttribute('aria-current','page');});
