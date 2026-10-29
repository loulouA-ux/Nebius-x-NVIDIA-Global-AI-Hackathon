import {test,expect} from '@playwright/test';
test('staging host controls create, copy, switch proof method, verify and refresh with fixture APIs',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const project={projectId:'fixture-host',name:'Fixture staging',hostname:'staging.example.test',verification:{status:'pending',method:null,verifiedAt:null,challenge:{txtName:'_shiptested.staging.example.test',fileUrl:'https://staging.example.test/.well-known/shiptested.txt',value:'fixture-proof-only',expiresAt:'2026-11-29T12:00:00Z'},methods:['dns','file']}};
 const calls:string[]=[];
 await page.route('**/api/**',r=>r.fulfill({status:401,json:{error:'Fixture signed-out'}}));
 await page.route('**/api/projects',r=>{if(r.request().method()==='POST'){calls.push('create');expect(r.request().postDataJSON()).toMatchObject({name:'Fixture staging',stagingUrl:'https://staging.example.test'});return r.fulfill({json:project});}return r.fulfill({json:{projects:[]}});});
 await page.route('**/api/projects/fixture-host/**',r=>{const action=r.request().url().split('/').at(-1)!;calls.push(action);if(action==='verify')expect(r.request().postDataJSON()).toEqual({method:'file'});return r.fulfill({json:{...project,verification:{...project.verification,status:action==='verify'?'verified':'pending'}}});});
 await page.goto('/hosts');const create=page.getByRole('button',{name:'Create project and get challenge'});await expect(create).toBeDisabled();
 await page.getByLabel('Project name',{exact:true}).fill('Fixture staging');await page.getByLabel('Staging URL').fill('http://localhost/path');await expect(create).toBeDisabled();
 await page.getByLabel('Staging URL').fill('https://staging.example.test');await create.click();await expect(page.getByLabel('Choose a project')).toHaveValue('fixture-host');
 await page.getByRole('button',{name:'Copy name',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(project.verification.challenge.txtName);
 await page.getByRole('button',{name:'Copy value',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('fixture-proof-only');
 await page.getByRole('button',{name:'Well-known file'}).click();await expect(page.getByRole('button',{name:'Well-known file'})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Copy name',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(project.verification.challenge.fileUrl);
 await page.getByRole('button',{name:'Verify ownership'}).click();await expect(page.getByText(/is verified. Proof is rechecked/)).toBeVisible();
 await page.getByRole('button',{name:'Refresh challenge'}).click();await expect(page.getByText('New challenge issued. Replace the old value before verifying.')).toBeVisible();
 await page.getByRole('button',{name:'DNS TXT record'}).click();await expect(page.getByRole('button',{name:'DNS TXT record'})).toHaveAttribute('aria-pressed','true');expect(calls).toEqual(['create','verify','challenge']);
});
