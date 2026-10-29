import {expect,type Page} from '@playwright/test';
/** Check the actual rendered mark AND wordmark, not only an asset URL. */
export async function expectVisibleBrand(page:Page){
 const logo=page.locator('[data-shiptested-logo="tick-slash"]:visible').first();
 await expect(logo).toBeVisible();
 const read=()=>logo.evaluate(el=>{
  const brand=el.closest('a')||el.parentElement!;const rect=brand.getBoundingClientRect();
  // Canvas resolves modern CSS colours (including Tailwind oklab) and composites alpha.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='white';ctx.fillRect(0,0,1,1);
  const ancestors:Element[]=[];for(let n:Element|null=brand;n;n=n.parentElement)ancestors.unshift(n);
  for(const n of ancestors){ctx.fillStyle=getComputedStyle(n).backgroundColor;ctx.fillRect(0,0,1,1);}
  const luminance=(values:Uint8ClampedArray)=>{const c=Array.from(values).slice(0,3).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  const background=luminance(ctx.getImageData(0,0,1,1).data);
  const contrast=(element:Element)=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=getComputedStyle(element).color;ctx.fillRect(0,0,1,1);const foreground=luminance(ctx.getImageData(0,0,1,1).data);return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);};
  return {name:brand.textContent,visible:rect.left>=0&&rect.right<=innerWidth+1&&rect.top>=0&&rect.bottom<=innerHeight,contrast:Math.min(contrast(el),contrast(brand)),width:el.getBoundingClientRect().width};
 });
 // Theme providers may finish applying a saved preference just after hydration.
 await expect.poll(async()=>(await read()).contrast).toBeGreaterThanOrEqual(4.5);
 const result=await read();
 expect(result.name).toContain('ShipTested');expect(result.visible).toBe(true);expect(result.width).toBeGreaterThanOrEqual(24);expect(result.contrast).toBeGreaterThanOrEqual(4.5);
}
