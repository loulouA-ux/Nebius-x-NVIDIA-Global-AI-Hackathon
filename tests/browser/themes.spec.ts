import {test,expect} from '@playwright/test';
for(const width of [1440,390])test(`theme choice, logos and first paint persist at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:'dark'});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'Switch to light mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 for(const [name,file] of [['NVIDIA','nvidia-logo-light.svg'],['Nebius','nebius-black.svg'],['Tavily','tavily-full.svg']]){const logo=page.getByRole('img',{name,exact:true}).filter({visible:true});await expect(logo).toHaveAttribute('src',`/partners/${file}`);await expect(logo).toHaveCSS('filter','none');}
 await page.addInitScript(()=>{requestAnimationFrame(()=>{(window as unknown as {firstTheme:string}).firstTheme=document.documentElement.dataset.theme||'';});});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect.poll(()=>page.evaluate(()=>(window as unknown as {firstTheme:string}).firstTheme)).toBe('light');
 await page.goto('/reports');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.getByRole('button',{name:'Switch to dark mode'}).filter({visible:true}).click();await page.goto('/');
 for(const [name,file] of [['NVIDIA','nvidia-logo-dark.svg'],['Nebius','nebius-white.svg'],['Tavily','tavily-full-offwhite.svg']])await expect(page.getByRole('img',{name,exact:true}).filter({visible:true})).toHaveAttribute('src',`/partners/${file}`);
 await expect(page.locator('h1')).toHaveText('Check before you ship.');if(width===390)expect(await page.locator('main a.primary').evaluate(e=>e.getBoundingClientRect().width)).toBe(350);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('theme follows system when no preference is saved',async({page})=>{await page.emulateMedia({colorScheme:'light'});await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');});
