import {test,expect} from '@playwright/test';

for(const theme of ['light','dark'] as const){
 test(`hero evidence stays inside its panel and viewport in ${theme}`,async({page},testInfo)=>{
  await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  const panel=page.getByLabel('Public demo evidence');
  await expect(panel.getByRole('heading',{name:'Blocked',exact:true})).toBeVisible();
  await expect(panel.getByRole('link')).toHaveCount(4);
  for(const width of [360,390,480,600,768,800,900,1024,1280,1440]){
   await test.step(`${width}px`,async()=>{
    await page.setViewportSize({width,height:1200});
    await panel.scrollIntoViewIfNeeded();
    // Rounded corners produce a slightly smaller intersection than the bounding box.
    await expect(panel).toBeInViewport({ratio:0.99});
    const geometry=await panel.evaluate(el=>({
     panel:el.getBoundingClientRect().toJSON(),
     children:[...el.querySelectorAll('a,h2,strong,small')].map(child=>child.getBoundingClientRect().toJSON()),
     scroll:document.documentElement.scrollWidth,
    }));
    expect(geometry.panel.left).toBeGreaterThanOrEqual(0);
    expect(geometry.panel.right).toBeLessThanOrEqual(width);
    for(const box of geometry.children){
     expect(box.width).toBeGreaterThan(0);
     expect(box.left).toBeGreaterThanOrEqual(geometry.panel.left);
     expect(box.right).toBeLessThanOrEqual(geometry.panel.right);
     expect(box.top).toBeGreaterThanOrEqual(geometry.panel.top);
     expect(box.bottom).toBeLessThanOrEqual(geometry.panel.bottom);
    }
    expect(geometry.scroll).toBeLessThanOrEqual(width);
    await page.screenshot({path:testInfo.outputPath(`evidence-${theme}-${width}.png`)});
   });
  }
 });
}
