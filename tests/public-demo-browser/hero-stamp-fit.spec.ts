import {test,expect} from '@playwright/test';

for(const theme of ['light','dark'] as const){
 test(`settled hero stamp stays inside scene and viewport in ${theme}`,async({page},testInfo)=>{
  await page.emulateMedia({colorScheme:theme,reducedMotion:'no-preference'});
  await page.setViewportSize({width:800,height:1200});
  await page.goto('/');
  const voyage=page.locator('.voyage[data-mode="hero"]');
  await expect(voyage).toHaveAttribute('data-playing','true');
  await expect(voyage).toHaveAttribute('data-playing','false',{timeout:15000});
  await expect(voyage).toHaveAttribute('data-arrived','true');
  await page.evaluate(()=>document.fonts.ready);
  await voyage.locator('.voyage-desktop .voyage-stamp').evaluate(async e=>{
   await Promise.all(e.getAnimations().map(a=>a.finished));
  });
  for(const width of [480,600,768,800,900,1024,1280,1440]){
   await test.step(`${width}px`,async()=>{
    await page.setViewportSize({width,height:1200});
    const scene=page.locator('.voyage-desktop');
    await expect(scene).toBeVisible();
    const geometry=await scene.evaluate(svg=>{
     const box=svg.getBoundingClientRect();
     const stamp=svg.querySelector('.voyage-stamp')!;
     const rect=stamp.getBoundingClientRect();
     const text=stamp.querySelector('.voyage-verdict')!.getBoundingClientRect();
     return {scene:box.toJSON(),stamp:rect.toJSON(),text:text.toJSON(),width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,viewBoxWidth:(svg as SVGSVGElement).viewBox.baseVal.width};
    });
    for(const box of [geometry.stamp,geometry.text]){
     expect(box.width).toBeGreaterThan(0);
     expect(box.left).toBeGreaterThanOrEqual(geometry.scene.left);
     expect(box.right).toBeLessThanOrEqual(geometry.scene.right);
     expect(box.top).toBeGreaterThanOrEqual(geometry.scene.top);
     expect(box.bottom).toBeLessThanOrEqual(geometry.scene.bottom);
     expect(box.left).toBeGreaterThanOrEqual(0);
     expect(box.right).toBeLessThanOrEqual(width);
     expect(box.top).toBeGreaterThanOrEqual(0);
     expect(box.bottom).toBeLessThanOrEqual(geometry.height);
    }
    // Include the stamp rotation in the measured viewBox-space margin.
    expect((geometry.scene.right-geometry.stamp.right)/geometry.scene.width*geometry.viewBoxWidth).toBeGreaterThanOrEqual(16);
    expect(geometry.scene.width).toBeLessThanOrEqual(width);
    expect(geometry.scroll).toBeLessThanOrEqual(width);
    await page.screenshot({path:testInfo.outputPath(`stamp-${theme}-${width}.png`)});
   });
  }
 });
}
