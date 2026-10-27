import {test,expect} from '@playwright/test';
test('usage distinguishes incomplete reports, test billing and unmetered costs',async({page})=>{
  await page.route('**/api/usage',r=>r.fulfill({json:{remaining:7,limit:10,reserved:3,scope:'workspace',outcomes:[{state:'completed',count:2},{state:'failed',count:1}],verdicts:[{verdict:'Incomplete',count:2}],daily:[{day:'2026-10-27',count:3}],completedReports:2,averageDurationMs:2000,cost:{detail:'Provider and hosting costs are not yet metered; no cost estimate is presented.'}}}));
  await page.route('**/api/billing/status',r=>r.fulfill({json:{canManage:true,configured:true,testMode:true,priceMinor:300,currency:'GBP',scansPerSeat:5,plan:'free',seats:1,occupied:1,subscriptionStatus:'none'}}));
  await page.route('**/api/billing/checkout',r=>{expect(r.request().postDataJSON().seats).toBe(2);return r.fulfill({status:503,json:{error:'Test checkout unavailable'}});});
  await page.goto('/usage');await expect(page.getByRole('heading',{name:'7 scans remaining'})).toBeVisible();
  await expect(page.getByText('Incomplete: 2')).toBeVisible();
  await page.getByLabel('Seats',{exact:true}).fill('2');await expect(page.getByText('Monthly total: £6.00.')).toBeVisible();
  await page.getByRole('button',{name:'Continue to test checkout'}).click();await expect(page.locator('main').getByRole('alert')).toContainText('Test checkout unavailable');
  await page.screenshot({path:'test-results/usage-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/usage-mobile.png',fullPage:true});
});
