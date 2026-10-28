import {test,expect} from '@playwright/test';
test('developer availability is honest and public instructions do not enable live APIs',async({page,request})=>{
 await page.goto('/');
 await page.getByRole('link',{name:'Start building'}).click();
 await expect(page).toHaveURL(/\/developers$/);
 await expect(page.getByRole('heading',{name:'Build on evidence.'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Connect your agent'})).toBeVisible();
 await expect(page.getByText('The hosted preview and source branch can include improvements beyond the published 0.1.0 packages.',{exact:false})).toBeVisible();
 await expect(page.getByText('Source-code exploitability, Git history and unsupported dependency formats are not established.',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('link',{name:'Documentation',exact:true})).toHaveAttribute('href','https://docs.shiptested.com/docs');
 await expect(page.locator('#cli pre')).toContainText('npx @heysalad/shiptested-cli@0.1.0 scan package-lock.json --json');
 const r=await request.post('/api/scans',{data:{}});expect(r.status()).toBe(403);
});
