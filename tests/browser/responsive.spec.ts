import {test,expect} from '@playwright/test';
for(const width of [360,768,1440]) {
 test(`brand and workflow surfaces fit ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.route('**/api/demos?mode=availability',r=>r.fulfill({json:{recorded:false}}));
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
  await page.goto('/?view=overview');
  for(const name of ['Project setup','New scan']){
   if(width<=700 && name==='Project setup')await page.getByRole('button',{name:'More',exact:true}).click();
   await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click();await fits();
  }
  await page.getByRole('button',{name:'Or try the demo',exact:false}).click();
  await expect(page.getByRole('heading',{name:'Blocked · 2 high-severity findings'})).toBeVisible();await fits();
  await page.getByRole('button',{name:/Command Injection in lodash/}).click();await fits();
  await page.getByRole('button',{name:'Back to report'}).click();await fits();
 });
}

test('Back restores report and finding context without repeating a scan',async({page})=>{
 let scans=0;
 page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/scans'))scans++;});
 await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));
 await page.route('**/api/repositories',r=>r.fulfill({json:{repositories:[]}}));
 await page.route('**/api/repairs',r=>r.fulfill({json:{repairs:[]}}));
 await page.goto('/?view=overview');await page.getByRole('button',{name:'Offline fixture'}).click();
 await expect(page.getByRole('heading',{name:'Blocked · 2 high-severity findings'})).toBeVisible();
 await page.getByRole('button',{name:/Command Injection in lodash/}).click();
 await expect(page.getByRole('heading',{name:'Evidence',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Back to report'}).click();
 await expect(page.getByRole('heading',{name:'Blocked · 2 high-severity findings'})).toBeVisible();
 await page.goForward();await expect(page.getByRole('heading',{name:'Evidence',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Prepare tested repair'}).click();
 await expect(page.getByRole('heading',{name:'Verify a dependency repair'})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:'Evidence',exact:true})).toBeVisible();
 expect(scans).toBe(1);
});

test('finding and its evidence are adjacent on desktop and stacked on mobile',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/?view=overview');
 await page.getByRole('button',{name:'Offline fixture'}).click();
 await page.getByRole('button',{name:/Command Injection in lodash/}).click();
 const summary=page.getByRole('region',{name:'Finding and recommended action'});
 const evidence=page.getByRole('region',{name:'Source evidence'});
 await evidence.getByRole('button',{name:'Preview source'}).click();
 await expect(page.getByRole('link',{name:'Open original source in a new tab'})).toHaveAttribute('href','https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 let a=await summary.boundingBox(),b=await evidence.boundingBox();expect(b!.y).toBeGreaterThan(a!.y);
 await page.screenshot({path:'test-results/evidence-desktop.png',fullPage:true});
 await page.setViewportSize({width:360,height:900});
 await expect(page.locator('dialog.finding-drawer')).toHaveCount(0);await expect.poll(async()=>{a=await summary.boundingBox();b=await evidence.boundingBox();return b!.y-(a!.y+a!.height);}).toBeGreaterThan(-1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'test-results/evidence-mobile.png',fullPage:true});
});
