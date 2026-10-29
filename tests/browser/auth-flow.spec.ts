import {test,expect} from '@playwright/test';
for(const width of [1440,390]){
 test(`workspace sign-in retains destination at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.route('**/api/session',r=>r.fulfill({status:401,json:{error:'Sign in'}}));
  await page.goto('/repairs');
  const signIn=page.getByRole('region',{name:'Member access'}).getByRole('link',{name:'Sign in with GitHub'});
  await expect(signIn).toHaveAttribute('href','/sign-in?next=%2Frepairs');
  await signIn.click();
  await expect(page.getByRole('link',{name:'Continue with GitHub'})).toHaveAttribute('href','/api/auth/github/start?next=%2Frepairs');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('access key returns to the intended page and rejects external return links',async({page})=>{
 await page.route('**/api/session',r=>r.fulfill({json:{actor:{id:'fixture-member'}}}));
 await page.goto('/sign-in?next=%2Frepairs');await page.getByLabel('Individual access key').fill('synthetic-key');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/repairs$/);
 await page.goto('/sign-in?next=https%3A%2F%2Fevil.example');await expect(page.getByRole('link',{name:'Continue with GitHub'})).toHaveAttribute('href','/api/auth/github/start');
});
test('failed sign-out preserves identity and successful retry shows confirmation',async({page})=>{
 let calls=0;
 await page.route('**/api/session',async r=>{if(r.request().method()==='DELETE'){calls++;await r.fulfill({status:calls===1?503:200,json:calls===1?{error:'Unavailable'}:{signedOut:true}});}else await r.fulfill({json:{actor:{id:'github:123'},login:'fixture-user'}});});
 await page.route('**/api/scans',r=>r.fulfill({json:{scans:[]}}));
 await page.setViewportSize({width:390,height:844});await page.goto('/scan');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByText('Could not confirm sign-out. Please try again.')).toBeVisible();
 await expect(page.locator('main').getByText('Signed in as fixture-user')).toBeVisible();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/\/sign-in\?signedOut=1$/);await expect(page.getByRole('status')).toContainText('You’re signed out');
});
test('cancelled and expired OAuth flows offer a safe retry',async({page})=>{
 for(const reason of ['cancelled','expired','unavailable']){await page.goto(`/sign-in?auth=${reason}&next=%2Fbatches`);await expect(page.getByRole('alert').filter({hasText:/sign-in/})).toBeVisible();await expect(page.getByRole('link',{name:'Continue with GitHub'})).toHaveAttribute('href','/api/auth/github/start?next=%2Fbatches');}
});
