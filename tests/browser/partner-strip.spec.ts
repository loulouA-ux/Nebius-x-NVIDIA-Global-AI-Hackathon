import {test, expect} from '@playwright/test';

for (const width of [1440, 1024, 390, 360]) {
  test(`Powered by dark marks preserve logo colours and fit ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 1000});
    await page.goto('/');
    const strip = page.getByRole('region', {name: 'AI providers'});
    await expect(strip.getByText('POWERED BY', {exact: true})).toBeVisible();
    await expect(strip.getByText('Advisory data from OSV.dev', {exact: true})).toBeVisible();
    for (const [name, label] of [['NVIDIA', 'Nemotron 3 Super'], ['Nebius', 'Token Factory'], ['Tavily', 'Search API']]) {
      const logo = strip.getByRole('img', {name, exact: true}).filter({visible:true});
      await expect(logo).toHaveCSS('filter', 'none');
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await expect(strip.getByText(label, {exact: true})).toHaveCSS('color', 'rgb(142, 152, 166)');
    }
    await page.evaluate(() => document.fonts.ready);
    if(width===1440)expect(await strip.evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(900);
    const geometry = await strip.evaluate(el => {
      const rect = (e: Element) => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return [...el.querySelectorAll('.partner-strip-item')].map(item => ({
        item: rect(item), tile: rect(item.querySelector('.partner-logo-space')!),
        logo: rect(item.querySelector('img')!), label: rect(item.querySelector('.partner-strip-label')!),
        background: getComputedStyle(item.querySelector('.partner-logo-space')!).backgroundColor,
      }));
    });
    expect(geometry).toHaveLength(3);
    for (const {item,tile,logo,label,background} of geometry) {
      expect(background).toBe('rgba(0, 0, 0, 0)');
      expect(tile.height).toBe(64);
      expect(logo.x).toBeGreaterThanOrEqual(tile.x);
      expect(logo.right).toBeLessThanOrEqual(tile.right);
      expect(logo.y).toBeGreaterThanOrEqual(tile.y);
      expect(logo.bottom).toBeLessThanOrEqual(tile.bottom);
      if(width<768)expect(label.y).toBeGreaterThanOrEqual(tile.bottom);else expect(label.x).toBeGreaterThanOrEqual(tile.right);
      expect(label.right).toBeLessThanOrEqual(item.right);
      expect(item.right).toBeLessThanOrEqual(width);
    }
    for(let i=0;i<geometry.length;i++)for(let j=i+1;j<geometry.length;j++){
      const a=geometry[i].item,b=geometry[j].item;
      expect(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await strip.screenshot({path: `docs/ui-review/final-powered-by-${width}.png`});
  });
}
