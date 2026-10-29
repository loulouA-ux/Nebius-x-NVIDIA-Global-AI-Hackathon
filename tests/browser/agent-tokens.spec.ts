import {test,expect} from '@playwright/test';
test('creates a scoped token, hides its value and revokes it',async({page})=>{
 await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'},workspaces:[{id:'github:1',name:'Personal workspace',plan:'free',seat_limit:1,seats_used:1,role:'owner'}],members:[],events:[]}}));
 let created=false,revoked=false;
 await page.route('**/api/tokens',r=>{
  if(r.request().method()==='POST'){expect(r.request().postDataJSON()).toEqual({name:'My agent',canScan:true});created=true;return r.fulfill({json:{token:'st_'+'a'.repeat(64)}});}
  if(r.request().method()==='DELETE'){revoked=true;return r.fulfill({json:{revoked:true}});}
  return r.fulfill({json:{tokens:created?[{id:'fixture',name:'My agent',can_scan:true,expires_at:'2026-11-27',revoked_at:revoked?'2026-10-27':null}]:[]}});
 });
 await page.goto('/team');await page.getByLabel('Token name').fill('My agent');await page.getByLabel('Allow starting and cancelling repository scans').check();await page.getByRole('button',{name:'Create token',exact:true}).click();
 await expect(page.getByLabel('New token')).toHaveAttribute('type','password');await page.getByRole('button',{name:'Dismiss',exact:true}).click();await expect(page.getByLabel('New token')).toHaveCount(0);
 await page.getByRole('button',{name:'Revoke My agent'}).click();await expect(page.getByText('Revoked',{exact:false})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/agent-tokens-mobile.png',fullPage:true});
});
