import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/platform-browser',outputDir:'.private/platform-test-results',workers:1,use:{headless:true},webServer:[
 {command:'npx next start apps/docs --port 3181 --hostname 127.0.0.1',url:'http://127.0.0.1:3181',reuseExistingServer:false},
 {command:'npx next start apps/dev --port 3182 --hostname 127.0.0.1',url:'http://127.0.0.1:3182',reuseExistingServer:false},
 {command:'npx next start apps/mcp --port 3180 --hostname 127.0.0.1',url:'http://127.0.0.1:3180',reuseExistingServer:false}
]});
