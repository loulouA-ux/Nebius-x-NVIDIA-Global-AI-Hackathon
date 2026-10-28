import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {buildFixture,respond} from './security-fixture';

// Public screenshots use the explicitly synthetic fixture only.
const shots='docs/security-dashboard/screenshots';mkdirSync(shots,{recursive:true});
type Fixture=Awaited<ReturnType<typeof buildFixture>>;
let finished:Fixture,active:Fixture;
test.beforeAll(async()=>{finished=await buildFixture();active=await buildFixture({active:true});});
test.afterAll(async()=>{await finished.close();await active.close();});

async function serve(page:Page,fixture:()=>Fixture,mode:{status?:number}={}){
 await page.route('**/api/security**',async route=>{
  if(mode.status)return route.fulfill({status:mode.status,json:{error:'Unavailable'}});
  try{route.fulfill({json:await respond(fixture().q,route.request().url())});}catch(e){const s=(e as {status?:number}).status||503;route.fulfill({status:s,json:{error:(e as Error).message}});}
 });
 await page.route('**/api/session',route=>route.fulfill({json:{signedIn:true,login:'synthetic-user'}}));
}
const theme=(page:Page,t:'light'|'dark')=>page.addInitScript(v=>{try{localStorage.setItem('shipcheck-theme',v);}catch{}},t);
const noOverflow=async(page:Page)=>{const wide=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth?[]:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1&&!e.closest('[class*=tableWrap]')).slice(0,8).map(e=>`${e.tagName}.${e.className} r=${Math.round(e.getBoundingClientRect().right)} w=${Math.round(e.getBoundingClientRect().width)} p=${e.parentElement?.tagName}.${e.parentElement?.className} ${(e.textContent||'').slice(0,40)}`));if(wide.length)console.log('overflow:',wide);return !wide.length;};

test('overview derives verdicts and processing separately, and charts open filtered lists',async({page})=>{
 await page.setViewportSize({width:1440,height:1100});await serve(page,()=>finished);
 await page.goto('/security-overview');
 await expect(page.getByRole('heading',{name:'Security overview'})).toBeVisible();
 await expect(page.getByText('of 200 completed reports (current revisions)')).toBeVisible();
 await expect(page.getByRole('button',{name:'Blocked: 95 of 200. Show these'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Incomplete: 101 of 200. Show these'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Skipped: 8 of 215. Show these'})).toBeVisible();
 await expect(page.getByRole('button',{name:/^No supported manifest scanned: 73 of 101/})).toBeVisible();
 await expect(page.getByRole('button',{name:/95\s*reports checked zero dependencies/})).toBeVisible();
 await expect(page.getByText('Batch finished · no automatic updates')).toBeVisible();
 await page.screenshot({path:`${shots}/overview-desktop-dark.png`,fullPage:true});
 await theme(page,'light');await page.reload();await expect(page.getByText('of 200 completed reports (current revisions)')).toBeVisible();await page.waitForTimeout(500);
 await page.screenshot({path:`${shots}/overview-desktop-light.png`,fullPage:true});await theme(page,'dark');await page.reload();await expect(page.getByText('of 200 completed reports (current revisions)')).toBeVisible();
 // Keyboard: focus a chart legend entry and activate it.
 const blocked=page.getByRole('button',{name:'Blocked: 95 of 200. Show these'});await blocked.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/view=repositories&verdict=Blocked/);
 await expect(page.getByRole('row')).toHaveCount(51);
 await expect(page.getByText('1–50 of 95 repositories')).toBeVisible();
 // Deep link survives reload.
 await page.reload();await expect(page.getByRole('button',{name:/^Blocked\s*95/,pressed:true})).toBeVisible();
 expect(await noOverflow(page)).toBe(true);
});

test('findings group by advisory and the evidence drawer is accessible',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await serve(page,()=>finished);
 await page.goto('/security-overview?view=findings');
 const first=page.getByRole('row').nth(1);await expect(first).toContainText('GHSA-syn1-0001-aaaa');await expect(first).toContainText('95');
 await page.getByRole('searchbox',{name:'Search advisory, package or repository'}).fill('yaml');
 await expect(page).toHaveURL(/q=yaml/);await expect(page.getByRole('row')).toHaveCount(2);
 await page.getByRole('button',{name:'Evidence for GHSA-syn1-0004-dddd'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog.getByText('Unknown · not recorded')).toBeVisible();
 await expect(dialog.getByText(/not confirmed|has not been checked/).first()).toBeVisible();await page.waitForTimeout(400);
 await page.screenshot({path:`${shots}/evidence-drawer-desktop-dark.png`});
 await theme(page,'light');await page.reload();await expect(dialog).toBeVisible();await expect(dialog.getByText('Unknown · not recorded')).toBeVisible();await page.waitForTimeout(500);await page.screenshot({path:`${shots}/evidence-drawer-desktop-light.png`});await theme(page,'dark');
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page).not.toHaveURL(/advisory=/);
 await page.getByRole('searchbox').fill('');await expect(page).not.toHaveURL(/q=/);
 await page.screenshot({path:`${shots}/findings-desktop-dark.png`,fullPage:true});
});

test('coverage shows reasons honestly and finds zero-dependency repositories',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await serve(page,()=>finished);
 await page.goto('/security-overview?view=coverage&gap=zero_dependencies');
 await expect(page.getByText('1–50 of 95 repositories')).toBeVisible();
 await page.goto('/security-overview?view=coverage&gap=omitted_files&verdict=Blocked');
 await page.getByRole('row').nth(1).locator('summary').click();
 await expect(page.getByText('Unsupported lockfile format').first()).toBeVisible();
 await page.goto('/security-overview?view=coverage&stage=partial');
 await page.getByRole('row').nth(1).locator('summary').click();
 await expect(page.getByText('Manifest could not be parsed or scanned').first()).toBeVisible();
 await page.goto('/security-overview?view=coverage');
 await page.screenshot({path:`${shots}/coverage-desktop-dark.png`,fullPage:true});
});

test('process view shows waiting, failed and skipped entries with recorded times only',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await serve(page,()=>active);
 await page.goto('/security-overview?view=process');
 await expect(page.getByText('Batch in progress · updates every 10 s while visible')).toBeVisible();
 await expect(page.getByRole('button',{name:'Waiting to submit: 25 of 215. Show these'})).toBeVisible();
 await expect(page.getByText(/Per-stage timing .* is not recorded/)).toBeVisible();
 await page.getByRole('button',{name:'Failed: 7 of 215. Show these'}).click();
 await expect(page.getByRole('row').nth(1)).toContainText('HTTP 422');
 await page.getByRole('button',{name:'Skipped: 8 of 215. Show these'}).click();
 await expect(page.getByRole('row').nth(1)).toContainText('Empty repository — no scan submitted');
 await page.goto('/security-overview?view=process');
 await page.screenshot({path:`${shots}/process-desktop-dark.png`,fullPage:true});
});

test('mobile layouts in both themes do not overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await serve(page,()=>finished);
 for(const t of ['dark','light'] as const){
  await theme(page,t);
  for(const view of ['overview','findings','coverage']){
   await page.goto(`/security-overview${view==='overview'?'':`?view=${view}`}`);await expect(page.getByRole('heading',{name:'Security overview'})).toBeVisible();
   await expect(page.getByText(/Last successful update \d/)).toBeVisible();
   expect(await noOverflow(page),`${view} ${t}`).toBe(true);
   await page.screenshot({path:`${shots}/${view}-mobile-${t}.png`});
  }
 }
 await page.goto('/security-overview?view=findings');await page.getByRole('button',{name:/^Evidence for GHSA-syn1-0001/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.waitForTimeout(400);expect(await noOverflow(page)).toBe(true);
 await page.screenshot({path:`${shots}/evidence-drawer-mobile-light.png`});
});

test('signed-out and stale states keep private data out of view',async({page})=>{
 await serve(page,()=>finished);await page.goto('/security-overview');await expect(page.getByText('of 200 completed reports (current revisions)')).toBeVisible();
 await page.unroute('**/api/security**');await serve(page,()=>finished,{status:503});
 await page.getByRole('button',{name:'Refresh',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Live updates'})).toContainText('Last successful update');await expect(page.getByText('of 200 completed reports (current revisions)')).toBeVisible();
 await page.unroute('**/api/security**');await serve(page,()=>finished,{status:401});
 await page.getByRole('button',{name:'Refresh',exact:true}).click();
 await expect(page.getByRole('link',{name:'Sign in with GitHub'})).toBeVisible();await expect(page.getByText('of 200 completed reports')).toHaveCount(0);
});
