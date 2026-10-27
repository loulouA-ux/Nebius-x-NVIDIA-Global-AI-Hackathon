import {test,expect} from '@playwright/test';
test('developer availability is honest and public instructions do not enable live APIs',async({page,request})=>{
 await page.goto('/');await page.getByRole('link',{name:'Build with ShipTested'}).click();await expect(page).toHaveURL(/\/developers$/);await expect(page.getByText('Packages published.',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'MCP for your agent'})).toBeVisible();await expect(page.getByText('These are configuration guides, not app-directory listings or vendor endorsements.',{exact:false})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('link',{name:'Documentation',exact:true})).toHaveAttribute('href','https://docs.shiptested.com/docs');await expect(page.getByText('npx @heysalad/shiptested-cli@0.1.0 scan package-lock.json --json',{exact:true})).toBeVisible();
 const r=await request.post('/api/scans',{data:{}});expect(r.status()).toBe(403);
});
