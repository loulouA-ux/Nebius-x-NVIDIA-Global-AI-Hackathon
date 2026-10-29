import {test,expect} from '@playwright/test';
const token='a'.repeat(64);
test('shared report uses a body token and exposes no mutation controls',async({page})=>{
  await page.route('**/api/shared-report',r=>{expect(r.request().method()).toBe('POST');expect(r.request().postDataJSON()).toEqual({token});expect(r.request().url()).not.toContain(token);return r.fulfill({json:{readOnly:true,report:{id:'fixture',status:'Incomplete',createdAt:'2026-10-27T22:00:00Z',dependencies:[],findings:[],checks:[{name:'Manifest coverage',state:'incomplete',detail:'No supported files found.'}]}}});});
  await page.setViewportSize({width:390,height:844});await page.goto(`/shared#${token}`);
  await expect(page.getByRole('heading',{name:'Incomplete',exact:true})).toBeVisible();
  await expect(page.getByText('No supported files found.')).toBeVisible();
  await expect(page.getByRole('button',{name:/dismiss|acknowledge|scan/i})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/shared-report-mobile.png',fullPage:true});
});
test('expired shared report shows recovery instead of stale evidence',async({page})=>{
  await page.route('**/api/shared-report',r=>r.fulfill({status:404,json:{error:'Share link is expired or revoked.'}}));
  await page.goto(`/shared#${token}`);await expect(page.locator('main').getByRole('alert')).toContainText('expired or revoked');
});
test('workspace owner sees seat limits and member management',async({page})=>{
  await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'},workspaces:[{id:'github:1',name:'Personal workspace',plan:'team',seat_limit:2,seats_used:2,role:'owner'}],members:[{actor_id:'github:1',role:'owner'},{actor_id:'github:2',role:'member'}],events:[]}}));
  await page.goto('/team');await expect(page.getByText('Team plan · 2 of 2 seats occupied.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Create invitation'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Remove member'})).toHaveCount(1);
  await page.screenshot({path:'test-results/team-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/team-mobile.png',fullPage:true});
});
