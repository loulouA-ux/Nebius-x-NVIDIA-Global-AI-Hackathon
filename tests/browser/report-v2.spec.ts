import {test,expect} from '@playwright/test';
test('groups captured findings, keeps evidence and caps research',async({page})=>{
 await page.goto('/reports/demo-recorded');await expect(page.getByRole('button',{name:'By package',exact:true})).toHaveAttribute('aria-pressed','true');
 const group=page.locator('.package-group');await expect(group).toHaveCount(1);await expect(group.locator('.report-row')).toHaveCount(5);
 await page.getByRole('button',{name:'All advisories',exact:true}).click();await expect(page.locator('.report-row')).toHaveCount(5);
 const research=page.locator('.research-sources');await expect(research).not.toHaveAttribute('open','');await research.locator('summary').first().click();expect(await research.locator('.research-item').count()).toBeLessThanOrEqual(5);
 await expect(page.locator('.row-decision')).toHaveCount(0);
});
