import {test, expect} from '@playwright/test';

for (const width of [1440, 1024, 390, 360]) {
  test(`Powered by tiles preserve logo colours and fit ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 1000});
    await page.goto('/');
    const strip = page.getByRole('region', {name: 'AI providers'});
    await expect(strip.getByText('POWERED BY', {exact: true})).toBeVisible();
    await expect(strip.getByText('Advisory data from OSV.dev', {exact: true})).toBeVisible();
    for (const [name, label] of [['NVIDIA', 'Nemotron 3 Super'], ['Nebius', 'Token Factory'], ['Tavily', 'Search API']]) {
      const logo = strip.getByRole('img', {name, exact: true});
      await expect(logo).toHaveCSS('filter', 'none');
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await expect(strip.getByText(label, {exact: true})).toHaveCSS('color', 'rgb(154, 166, 182)');
    }
    await page.evaluate(() => document.fonts.ready);
    const geometry = await strip.evaluate(el => {
      const rect = (e: Element) => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return [...el.querySelectorAll('.partner-strip-item')].map(item => ({
        item: rect(item), tile: rect(item.querySelector('.partner-strip-tile')!),
        logo: rect(item.querySelector('img')!), label: rect(item.querySelector('.partner-strip-label')!),
        background: getComputedStyle(item.querySelector('.partner-strip-tile')!).backgroundColor,
      }));
    });
    expect(geometry).toHaveLength(3);
    for (const {item,tile,logo,label,background} of geometry) {
      expect(background).toBe('rgb(255, 255, 255)');
      expect(tile.height).toBe(width < 768 ? 72 : 88);
      expect(logo.x).toBeGreaterThanOrEqual(tile.x);
      expect(logo.right).toBeLessThanOrEqual(tile.right);
      expect(logo.y).toBeGreaterThanOrEqual(tile.y);
      expect(logo.bottom).toBeLessThanOrEqual(tile.bottom);
      expect(label.y).toBeGreaterThanOrEqual(tile.bottom);
      expect(label.right).toBeLessThanOrEqual(item.right);
      expect(item.right).toBeLessThanOrEqual(width);
    }
    const gridWidth = await strip.locator('.partner-strip-grid').evaluate(el => el.getBoundingClientRect().width);
    for (let i=1;i<geometry.length;i++) {
      if (width < 768) {
        expect(geometry[i].item.y).toBeGreaterThanOrEqual(geometry[i-1].item.bottom);
        expect(geometry[i].tile.width).toBe(gridWidth);
      } else {
        expect(geometry[i].item.x).toBeGreaterThanOrEqual(geometry[i-1].item.right);
        expect(geometry[i].tile.y).toBe(geometry[0].tile.y);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await strip.screenshot({path: `docs/partner-strip-review/powered-by-${width}.png`});
  });
}
