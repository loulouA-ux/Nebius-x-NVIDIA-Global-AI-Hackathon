import {defineConfig} from '@playwright/test';
const browsers = ['chromium','webkit','firefox'] as const;
export default defineConfig({
 testDir:'./tests/public-demo-browser',
 use:{baseURL:'http://127.0.0.1:3164'},
 workers:1,
 projects:browsers.flatMap(browserName=>[1,2].map(deviceScaleFactor=>({
  name:`${browserName}-dpr${deviceScaleFactor}`,
  // Keep the existing Chromium suite (including LCP instrumentation), and run
  // the geometry regression across every engine/DPR combination.
  ...(browserName==='chromium'&&deviceScaleFactor===1?{}:{testMatch:'**/hero-stamp-fit.spec.ts'}),
  use:{browserName,deviceScaleFactor},
 }))),
 webServer:{command:'npx next start --hostname 127.0.0.1 --port 3164',url:'http://127.0.0.1:3164',reuseExistingServer:false,env:{SHIPCHECK_PUBLIC_DEMO:'1'}},
});
