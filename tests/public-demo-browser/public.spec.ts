import {test,expect} from '@playwright/test';
test('public deployment permits replay only',async({page,request})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Ship without');
 await page.goto('/reports/demo-recorded');await expect(page.locator('.report-row')).toHaveCount(5);
 for(const path of ['/api/scans','/api/session','/api/repairs','/api/projects','/api/repositories','/api/auth/github/start','/api/auth/github/callback']){
  expect((await request.get(path)).status()).toBe(403);expect((await request.post(path,{data:{mode:'live'}})).status()).toBe(403);
 }
 for(const path of ['/scan','/hosts','/repairs','/sign-in']){const response=await page.goto(path);expect(response!.status()).toBe(403);await expect(page.locator('h1')).toHaveText('Demo deployment — run locally for live scans');}
 const health=await (await request.get('/api/health')).json();expect(health).toMatchObject({publicDemo:true,providers:{tavily:false,nebius:false},urlScanning:false});
});
