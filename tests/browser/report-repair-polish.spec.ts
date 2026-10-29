import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [1440,390]) {
 test(`report priority and coverage remain usable at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/reports/demo-recorded');
  const next=page.getByRole('region',{name:'Recommended next step'});
  await expect(next).toBeVisible();
  await next.getByRole('button',{name:'Review scan coverage'}).click();
  await expect(page.locator('details.scope')).toHaveAttribute('open','');
  await expect(page.locator('details.scope > summary')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await next.scrollIntoViewIfNeeded();
  await page.screenshot({path:`.private/report-polish-${width}.png`,fullPage:true});
  expect((await new AxeBuilder({page}).include('section[aria-label="Recommended next step"]').analyze()).violations).toEqual([]);
  await next.getByRole('button',{name:'Review priority finding'}).click();
  await expect(page).toHaveURL(/findings/);
 });
 test(`repair setup is readable without enabling writes at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});let writes=0;
  await page.route('**/api/repositories',r=>r.fulfill({json:{repositories:[{id:1,full_name:'team/example-repository'}]}}));
  await page.route('**/api/repairs',r=>{if(r.request().method()!=='GET')writes++;return r.fulfill({json:{repairs:[]}});});
  await page.goto('/repairs?package=lodash');
  await expect(page.getByLabel('Dependency package name')).toHaveValue('lodash');
  await expect(page.getByRole('button',{name:'Propose repair',exact:true})).toBeDisabled();
  await page.getByText('Which projects can be repaired?',{exact:true}).click();
  await expect(page.getByText(/Small npm projects only/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`.private/repair-polish-${width}.png`,fullPage:true});
  expect((await new AxeBuilder({page}).include('#new-repair').analyze()).violations).toEqual([]);
  await page.getByRole('button',{name:/Switch to light mode|^Light mode$/}).click();
  expect((await new AxeBuilder({page}).include('#new-repair').analyze()).violations).toEqual([]);
  await page.screenshot({path:`.private/repair-polish-light-${width}.png`});
  expect(writes).toBe(0);
 });
}
