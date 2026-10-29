import {test,expect} from '@playwright/test';
import {buildFixture,respond} from './security-fixture';
import {expectVisibleBrand} from '../ui/brand-check';
let fixture:Awaited<ReturnType<typeof buildFixture>>;
test.beforeAll(async()=>{fixture=await buildFixture();});test.afterAll(async()=>fixture.close());
for(const theme of ['light','dark'] as const)for(const width of [1440,390])test(`dashboard branding ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.addInitScript(t=>localStorage.setItem('shipcheck-theme',t),theme);
 await page.route('**/api/security**',async r=>r.fulfill({json:await respond(fixture.q,r.request().url())}));
 await page.route('**/api/session',r=>r.fulfill({json:{signedIn:true,login:'synthetic-user'}}));
 for(const view of ['overview','findings','repositories','coverage','process']){
  await page.goto(`/security-overview?view=${view}`);
  await expect(page.getByRole('heading',{name:'Security overview',exact:true})).toBeVisible();
  await expect(page.getByText('Batch finished · no automatic updates')).toBeVisible();
  await expectVisibleBrand(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.screenshot({path:`.private/dashboard-brand-${theme}-${width}.png`});
});
