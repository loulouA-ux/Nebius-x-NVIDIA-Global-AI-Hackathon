import {test,expect} from '@playwright/test';
for(const width of [360,768,1440]) {
 test(`brand and workflow surfaces fit ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));
  await page.route('**/api/projects',r=>r.fulfill({json:{projects:[]}}));
  await page.route('**/api/repositories',r=>r.fulfill({json:{repositories:[]}}));
  await page.route('**/api/repairs',r=>r.fulfill({json:{repairs:[{id:'11111111-1111-4111-8111-111111111111',state:'verified',package_name:'@organisation/a-very-long-dependency-package-name',repository_name:'organisation/a-very-long-repository-name-for-responsive-testing',created_at:'2026-10-26T00:00:00Z'}]}}));
  async function fits(){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
  for(const route of ['/','/sign-in','/repairs','/nonexistent-brand-page']){
   await page.goto(route);await expect(page.getByRole('link',{name:'ShipCheck home'})).toBeVisible();await fits();
   if(route==='/sign-in')await expect(page.getByLabel('Individual access key')).toBeVisible();
   await page.screenshot({path:`test-results/brand-${width}-${route.replaceAll('/','')||'home'}.png`,fullPage:true});
  }
  await page.goto('/');
  for(const name of ['Project setup','New scan']){
   await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click();await fits();
  }
  await page.getByRole('button',{name:'Run offline demo',exact:false}).click();
  await expect(page.getByRole('heading',{name:'2 blockers need attention'})).toBeVisible();await fits();
  await page.getByRole('button',{name:/Command Injection in lodash/}).click();await fits();
  await page.getByRole('button',{name:'Recommended actions',exact:true}).click();await fits();
 });
}
