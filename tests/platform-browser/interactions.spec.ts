import {test,expect} from '@playwright/test';
test('developer status recovers visibly from an HTTP error',async({page})=>{
 await page.route('**/api/status',r=>r.fulfill({status:503,json:{error:'Unavailable'}}));await page.goto('http://127.0.0.1:3182/');await expect(page.locator('main').getByRole('alert')).toContainText('Status could not be checked');await expect(page.getByRole('heading',{name:'Build with ShipTested.'})).toBeVisible();await page.screenshot({path:'.private/developer-status-recovery.png',fullPage:true});
});
test('developer buttons copy commands, change theme, load fixtures and show streamed evidence or failures',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.route('**/api/status',r=>r.fulfill({json:{mcp:'Fixture only',sites:{},packages:{}}}));
 let fail=false,submissions=0;
 await page.route('**/api/scan',r=>{submissions++;expect(r.request().postDataJSON().content).toContain('lockfileVersion');return r.fulfill(fail?{status:503,json:{error:'Fixture scan unavailable'}}:{contentType:'application/x-ndjson',body:JSON.stringify({type:'stage',progress:10,message:'Resolve: done'})+'\n'+JSON.stringify({type:'result',result:{status:'Blocked',findings:[{package:'lodash'}]}})+'\n'});});
 await page.goto('http://127.0.0.1:3182/');
 for(const card of await page.locator('.card').all()){await card.getByRole('button',{name:'Copy command'}).click();await expect(card.getByRole('status')).toHaveText('Copied');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(await card.locator('code').innerText());}
 const theme=await page.locator('html').getAttribute('class');await page.getByRole('button',{name:'Switch theme'}).click();await expect(page.locator('html')).not.toHaveAttribute('class',theme!);
 await expect(page.getByRole('button',{name:'Check with remote MCP'})).toBeDisabled();await page.getByRole('button',{name:'Use synthetic lodash fixture'}).click();await page.getByRole('button',{name:'Check with remote MCP'}).click();await expect(page.getByRole('heading',{name:'Returned evidence'})).toBeVisible();await expect(page.getByRole('list',{name:'Actual scan stages'})).toContainText('Resolve: done');
 fail=true;await page.getByRole('button',{name:'Check with remote MCP'}).click();await expect(page.locator('main').getByRole('alert')).toHaveText('Fixture scan unavailable');await expect(page.getByRole('heading',{name:'Returned evidence'})).toHaveCount(0);expect(submissions).toBe(2);
});
test('documentation navigation, search, sidebar and theme controls work',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 page.setDefaultTimeout(5000);
 await page.goto('http://127.0.0.1:3181/docs');
 await page.getByRole('button',{name:/^Search/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('combobox').fill('lockfile');
 await expect(page.getByRole('dialog').getByRole('option').first()).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 for(const path of ['quickstart','cli','mcp','agents','library','verdicts','sources','ai','privacy','example','self-hosting','changelog']){
  await page.locator(`#nd-sidebar a[href="/docs/${path}"]`).click();await expect(page).toHaveURL(new RegExp(`/docs/${path}$`));await expect(page.locator('h1')).toBeVisible();
  const copies=page.getByRole('button',{name:/^(Copy|Copied) (Anchor Link|Text)$/});
  for(let i=0;i<await copies.count();i++){
   await copies.nth(i).click();expect((await page.evaluate(()=>navigator.clipboard.readText())).length).toBeGreaterThan(0);
  }
 }
 await page.getByRole('button',{name:'Toggle Theme'}).click();
 await page.locator('#nd-sidebar').getByRole('button',{name:'Collapse Sidebar'}).click();await expect(page.locator(':focus')).toHaveAttribute('aria-expanded','false');await page.keyboard.press('Enter');

 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open Sidebar'}).click();await expect(page.getByRole('link',{name:'Quickstart',exact:true}).filter({visible:true})).toBeVisible();await page.locator('#nd-sidebar-mobile').getByRole('button',{name:'Close Sidebar'}).click();
 await page.getByRole('button',{name:'Open Search'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
});
