import {test,expect} from '@playwright/test';
for(const width of [1440,390])test(`workspace and billing navigation with header theme at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/session',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'}}}));
 await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'},workspaces:[{id:'github:1',name:'Personal workspace',role:'owner',plan:'free',seat_limit:1,seats_used:1}],members:[{actor_id:'github:1',role:'owner'}],events:[]}}));
 await page.route('**/api/usage',r=>r.fulfill({json:{remaining:5,limit:5,reserved:0,scope:'workspace',outcomes:[],verdicts:[],daily:[],completedReports:0,averageDurationMs:null,cost:{detail:'Fixture usage'}}}));
 await page.route('**/api/billing/status',r=>r.fulfill({json:{canManage:true,configured:false,testMode:false,priceMinor:300,currency:'GBP',scansPerSeat:5,plan:'free',seats:1,occupied:1,subscriptionStatus:'none'}}));
 await page.goto('/team');
 await expect(page.getByRole('heading',{name:'Workspace and team',exact:true})).toBeVisible();
 await expect(page.locator('.topbar').getByRole('link',{name:'ShipTested home'})).toBeVisible();
 await page.locator('.topbar').getByRole('button',{name:'Switch to light mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.screenshot({path:`.private/workspace-navigation-light-${width}.png`,fullPage:false});
 const nav=page.getByRole('navigation',{name:'Main navigation'}).filter({visible:true});
 if(width<768)await nav.locator('summary').click();
 await nav.getByRole('link',{name:'Usage and billing'}).click();
 await expect(page.getByRole('heading',{name:'Usage and billing',exact:true})).toBeVisible();
 await expect(page.getByText('Payments are not enabled.')).toBeVisible();
 await expect(page.getByRole('button',{name:/Continue to.*checkout/})).toHaveCount(0);
 await page.locator('.topbar').getByRole('button',{name:'Switch to dark mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`.private/workspace-navigation-dark-${width}.png`,fullPage:false});
 if(width<768)await nav.locator('summary').click();
 await nav.getByRole('link',{name:'Workspace and team'}).click();
 await expect(page.getByRole('heading',{name:'Workspace and team',exact:true})).toBeVisible();
});
test('workspace context stays isolated between two tabs',async({page,context})=>{
 await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{workspaceId:'workspace:first'},workspaces:[],members:[],events:[]}}));
 await page.goto('/team');
 await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('shiptested-workspace'))).toBe('workspace:first');
 const other=await context.newPage();await other.route('**/api/workspaces',r=>r.fulfill({json:{actor:{workspaceId:'workspace:second'},workspaces:[],members:[],events:[]}}));
 await other.goto('/team');await expect.poll(()=>other.evaluate(()=>sessionStorage.getItem('shiptested-workspace'))).toBe('workspace:second');
 for(const [tab,id] of [[page,'workspace:first'],[other,'workspace:second']] as const){
  await tab.route('**/api/usage',r=>{expect(r.request().headers()['x-shiptested-workspace']).toBe(id);return r.fulfill({json:{}});});
  await tab.evaluate(()=>fetch('/api/usage'));
 }
});
