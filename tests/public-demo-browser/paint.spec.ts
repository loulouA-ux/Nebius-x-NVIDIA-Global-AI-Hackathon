import {test,expect} from '@playwright/test';
for(const path of ['/','/privacy','/security','/reports','/reports/demo-recorded']){
 test(`initial content emits LCP: ${path}`,async({page},testInfo)=>{
  await page.addInitScript(()=>{
   const observed: {name:string;time:number;tag?:string}[]=[];
   Object.assign(window,{paintEntries:observed});
   for(const type of ['largest-contentful-paint','paint'])new PerformanceObserver(list=>{
    for(const entry of list.getEntries())observed.push({name:entry.entryType==='paint'?entry.name:entry.entryType,time:entry.startTime,tag:(entry as PerformanceEntry&{element?:Element}).element?.tagName});
   }).observe({type,buffered:true});
  });
  await page.goto(path);
  // No clicks, focus, scrolling, reduced motion or CSS overrides before measurement.
  await expect.poll(()=>page.evaluate(()=> (window as Window&{paintEntries?:{name:string}[]}).paintEntries?.some(e=>e.name==='largest-contentful-paint'))).toBe(true);
  await testInfo.attach('paint-timings',{body:JSON.stringify(await page.evaluate(()=> (window as Window&{paintEntries?:unknown}).paintEntries)),contentType:'application/json'});
 });
}
for(const colorScheme of ['light','dark'] as const)test(`desktop sidebar reaches viewport after scrolling: ${colorScheme}`,async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme});await page.goto('/reports/demo-recorded');
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await expect.poll(()=>page.locator('.shell>aside').evaluate(e=>({bottom:Math.round(e.getBoundingClientRect().bottom),height:Math.round(e.getBoundingClientRect().height),viewport:innerHeight}))).toEqual({bottom:900,height:900,viewport:900});
});
