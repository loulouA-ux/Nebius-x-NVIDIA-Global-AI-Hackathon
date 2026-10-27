import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/public-demo-browser',use:{baseURL:'http://127.0.0.1:3164'},workers:1,webServer:{command:'npx next start --hostname 127.0.0.1 --port 3164',url:'http://127.0.0.1:3164',reuseExistingServer:false,env:{SHIPCHECK_PUBLIC_DEMO:'1'}}});
