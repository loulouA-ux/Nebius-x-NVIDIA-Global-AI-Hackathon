import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'] as const)for(const width of [1440,390])test(`consistent fields and disclosure icons at ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
 await page.route('**/api/**',r=>r.fulfill({status:401,json:{error:'Sign in to continue'}}));
 await page.route('**/api/workspaces',r=>r.fulfill({json:{actor:{id:'github:1',workspaceId:'github:1'},workspaces:[{id:'github:1',name:'A long workspace name for client projects and security reviews',plan:'free',seat_limit:1,seats_used:1,role:'owner'}],members:[],events:[]}}));
 for(const route of ['/reports','/scan','/repairs','/team','/usage','/batches','/security-overview','/sign-in']){
  await page.goto(route);await page.locator('h1').first().waitFor();
  for(const select of await page.locator('select:visible').all()){
   const style=await select.evaluate(e=>{const s=getComputedStyle(e);return{border:s.borderColor,appearance:s.appearance,image:s.backgroundImage,padding:parseFloat(s.paddingInlineEnd),height:e.getBoundingClientRect().height,font:parseFloat(s.fontSize)};});
   expect(style.border,route).toBe(theme==='light'?'rgb(123, 133, 146)':'rgb(101, 113, 129)');expect(style.appearance,route).toBe('none');expect(style.image,route).toContain('data:image/svg+xml');expect(style.padding,route).toBeGreaterThanOrEqual(40);expect(style.height,route).toBeGreaterThanOrEqual(44);if(width===390)expect(style.font,route).toBeGreaterThanOrEqual(16);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);
 }
 await page.goto('/scan');const summary=page.getByText('Paste contents instead',{exact:true});await summary.focus();await page.keyboard.press('Enter');
 await expect(page.getByLabel('File format')).toBeVisible();await page.getByLabel('File format').selectOption('requirements.txt');await expect(page.getByLabel('File format')).toHaveValue('requirements.txt');
 const input=page.getByLabel('Manifest content',{exact:true});await input.fill('requests==2.32.0');await expect(input).toBeFocused();await expect(input).toHaveCSS('outline-width','2px');
 await summary.click();await expect(input).toBeHidden();await summary.click();await expect(input).toHaveValue('requests==2.32.0');
 await page.goto('/team');await page.getByLabel('New workspace name').fill('Client projects');await page.getByLabel('New workspace name').focus();
 await page.screenshot({path:`.private/forms-team-${width}-${theme}.png`,fullPage:false});
});
test('forced-colors retains native select affordances',async({page})=>{
 await page.emulateMedia({forcedColors:'active'});await page.goto('/scan');await page.getByText('Paste contents instead',{exact:true}).click();
 await expect(page.getByLabel('File format')).toHaveCSS('appearance','auto');await expect(page.getByLabel('File format')).toHaveCSS('background-image','none');
});
