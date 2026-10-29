import {test,expect} from '@playwright/test';
const states=['waiting','queued','running','completed','failed','cancelled','skipped'] as const;
function fixture(){
 const entries=Array.from({length:215},(_,i)=>({repository:`heysalad-ai/repository-${i}`,state:i<8?'skipped':i===8?'running':i===9?'queued':i===10?'completed':'waiting',verdict:i===10?'Incomplete':null,reportUrl:i===10?'/reports/11111111-1111-4111-8111-111111111111':null,detail:i<8?'Empty repository — no scan submitted.':null,updatedAt:null}));
 return {id:'example',title:'HeySalad · 215 repositories',createdAt:new Date().toISOString(),checkedAt:new Date().toISOString(),total:215,finished:9,counts:Object.fromEntries(states.map(s=>[s,entries.filter(e=>e.state===s).length])),entries};
}
test('shows all entries, filters/search, and updates without losing selection',async({page})=>{
 let batch=fixture();let fail=false;
 await page.route('**/api/batches',route=>route.fulfill({status:fail?503:200,json:fail?{error:'Unavailable'}:{batch}}));
 await page.goto('/batches');await expect(page.getByRole('row')).toHaveCount(216);
 await expect(page.getByText('Incomplete',{exact:true})).toBeVisible();
 await page.screenshot({path:'.private/batch-dashboard-desktop.png'});
 await page.getByRole('button',{name:'Skipped 8',exact:true}).click();await expect(page.getByRole('row')).toHaveCount(9);
 await page.getByRole('searchbox',{name:'Search repositories'}).fill('repository-0');await expect(page.getByRole('row')).toHaveCount(2);
 await page.getByRole('searchbox').fill('');await page.getByRole('button',{name:'All 215',exact:true}).click();
 batch={...batch,checkedAt:new Date().toISOString(),counts:{...batch.counts,queued:0,running:2},entries:batch.entries.map((e,i)=>i===9?{...e,state:'running'}:e)};
 await expect(page.getByRole('button',{name:'Running 2',exact:true})).toBeVisible({timeout:10000});
 fail=true;await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'last successful update'})).toContainText('last successful update');await expect(page.getByRole('row')).toHaveCount(216);
});
test('mobile layout and signed-out privacy',async({page})=>{
 await page.setViewportSize({width:390,height:844});let signedOut=false;
 await page.route('**/api/batches',route=>route.fulfill({status:signedOut?401:200,json:signedOut?{error:'Sign in'}:{batch:fixture()}}));
 await page.goto('/batches');await expect(page.getByRole('heading',{name:'Batch progress'})).toBeVisible();await expect(page.getByRole('row')).toHaveCount(216);
 await page.screenshot({path:'.private/batch-dashboard-mobile.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'.private/batch-dashboard-mobile.png'});
 signedOut=true;await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('link',{name:'Sign in with GitHub'})).toBeVisible();await expect(page.getByRole('row')).toHaveCount(0);
});
