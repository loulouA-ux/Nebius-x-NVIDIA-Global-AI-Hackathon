import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const routes=['/','/developers','/reports','/reports/demo-recorded','/scan','/hosts','/repairs','/team','/usage','/batches','/security-overview','/sign-in','/privacy','/security','/shared','/not-a-route'];
for(const width of [1440,390])test(`activate visible page controls at ${width}px without external side effects`,async({page,context})=>{
 test.setTimeout(180000);page.setDefaultTimeout(5000);
 await page.setViewportSize({width,height:900});
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.hostname!=='127.0.0.1')return r.fulfill({contentType:'text/html',body:'<h1>External destination intercepted for UI audit</h1>'});
  if(u.pathname.startsWith('/api/'))return r.fulfill({status:401,json:{error:'Sign in to continue'}});
  return r.continue();
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const ledger:Record<string,unknown>[]=[];
 const selector='a[href]:visible, button:visible, input:visible, textarea:visible, select:visible, summary:visible';
 for(const route of routes){
  console.log(`Auditing ${width}px ${route}`);
  await page.goto(route);await page.locator('h1').first().waitFor();
  // Wait for the member-access request rather than inventorying a transient skeleton.
  await expect(page.getByText('Checking member session…',{exact:true})).toHaveCount(0);
  const descriptors=await page.locator(selector).evaluateAll(es=>es.map((e,i)=>({index:i,tag:e.tagName,name:e.getAttribute('aria-label')||e.textContent?.trim().slice(0,160)||e.getAttribute('name')||e.getAttribute('id')||'',href:e.getAttribute('href'),disabled:e.matches(':disabled')})));
  for(const item of descriptors){
   await page.goto(route);await page.locator('h1').first().waitFor();await expect(page.getByText('Checking member session…',{exact:true})).toHaveCount(0);
   const element=page.locator(selector).nth(item.index);
   // Identity must still match before acting; never click a shifted control.
   expect(await element.evaluate(e=>e.tagName)).toBe(item.tag);
   if(item.disabled){await expect(element).toBeDisabled();ledger.push({route,...item,result:'disabled boundary checked'});continue;}
   const before=errors.length;
   const wasOpen=item.tag==='SUMMARY'?await element.evaluate(e=>(e.parentElement as HTMLDetailsElement).open):false;
   if(item.tag==='SELECT'){await element.focus();await expect(element).toBeFocused();}
   else if(item.tag==='INPUT'||item.tag==='TEXTAREA'){await element.click({timeout:5000});await expect(element).toBeFocused();}
   else {
    if(item.name==='Skip to main content')await element.focus();
    await element.click({timeout:5000});
    if(item.tag==='SUMMARY')await expect.poll(()=>element.evaluate(e=>(e.parentElement as HTMLDetailsElement).open)).toBe(!wasOpen);
    if(item.tag==='A'&&item.href?.startsWith('#'))expect(await page.locator(item.href).count()).toBeGreaterThan(0);
   }
   expect(errors.slice(before),`${route}: ${item.name}`).toEqual([]);
   ledger.push({route,...item,result:item.href?.startsWith('http')?'activated; external destination intercepted':'activated; no client exception'});
   for(const tab of context.pages())if(tab!==page)await tab.close();
  }
 }
 mkdirSync('.private/click-audit',{recursive:true});writeFileSync(`.private/click-audit/app-${width}.json`,JSON.stringify(ledger,null,2));
 expect(errors).toEqual([]);
});
