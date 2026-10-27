import {test,expect} from '@playwright/test';

test('skip navigation focuses main content',async({page})=>{
 await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));
 await page.goto('/scan');
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Skip to main content'})).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.locator('main')).toBeFocused();
});

test('mobile tabs are direct, keyboard accessible and omit duplicate visible sign in',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));await page.goto('/scan');
 const hosts=page.getByRole('link',{name:'Hosts',exact:true});await hosts.focus();await expect(hosts).toBeFocused();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/hosts$/);await expect(page.getByRole('heading',{name:'Staging hosts'})).toBeFocused();await expect(hosts).toHaveAttribute('aria-current','page');await expect(page.getByRole('link',{name:'Sign in with GitHub',exact:true})).toHaveCount(1);
});

test('identity survives history failure and can still sign out',async({page})=>{
 await page.route('**/api/session',r=>r.fulfill({json:{actor:{id:'github:123',role:'member'}}}));
 await page.route('**/api/scans',r=>r.fulfill({status:503,json:{error:'Unavailable'}}));
 await page.route('**/api/usage',r=>r.fulfill({status:503,json:{error:'Usage unavailable'}}));
 await page.setViewportSize({width:390,height:844});await page.goto('/scan');
 await expect(page.locator('main').getByText('GitHub account',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
 await expect(page.getByText('Saved scans could not be loaded.',{exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Sign in with GitHub',exact:true})).toHaveCount(0);
});

test('access-key sign in explains its purpose and retains error recovery',async({page})=>{
 await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Access key not recognised. Check your individual key.'}}));
 await page.goto('/sign-in');
 await expect(page.getByRole('link',{name:'Continue with GitHub'})).toBeVisible();
 await page.getByLabel('Individual access key').fill('synthetic-invalid-key');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByText('Access key not recognised. Check your individual key.',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Individual access key')).toHaveAttribute('aria-invalid','true');
 await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeEnabled();
});
