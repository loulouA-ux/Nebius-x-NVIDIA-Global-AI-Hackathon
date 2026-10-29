import {test,expect} from '@playwright/test';
test('chooses only a server-listed installation and can disconnect',async({page})=>{
 await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'},workspaces:[{id:'github:1',name:'Personal workspace',plan:'free',seat_limit:1,seats_used:1,role:'owner'}],members:[],events:[]}}));
 await page.route('**/api/tokens',r=>r.fulfill({json:{tokens:[]}}));
 let selected:number|null=null,connected=true;
 await page.route('**/api/github/connect',r=>{
  const method=r.request().method();
  if(method==='POST'){const data=r.request().postDataJSON();expect(data.installationId).toBe(12);expect(['select','remove']).toContain(data.action);selected=data.action==='select'?12:null;return r.fulfill({json:{ok:true}});}
  if(method==='DELETE'){connected=false;return r.fulfill({json:{disconnected:true}});}
  return r.fulfill({json:{connected,selected,selectedIds:selected?[selected]:[],expiresAt:'2026-10-28T00:00:00Z',installUrl:'https://github.com/apps/shiptested-fixture/installations/new',installations:[{id:12,account:'example-org'}]}});
 });
 await page.goto('/team');await expect(page.getByRole('link',{name:'Choose repositories on GitHub'})).toHaveAttribute('href','https://github.com/apps/shiptested-fixture/installations/new');
 await page.getByRole('button',{name:'Connect example-org'}).click();await expect(page.getByText('Connected',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Disconnect example-org',exact:true}).click();await expect(page.getByRole('button',{name:'Connect example-org',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Connect example-org',exact:true}).click();
 await page.getByRole('button',{name:'Disconnect repository access'}).click();await expect(page.getByRole('button',{name:'Authorize repository access'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/repository-connection-mobile.png',fullPage:true});
});
