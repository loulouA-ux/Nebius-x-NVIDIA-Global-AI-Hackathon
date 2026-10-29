import {test,expect} from '@playwright/test';
test('upload detects format and blocks oversized files before requests',async({page})=>{
 let scans=0;await page.route('**/api/scans',r=>{scans++;return r.fulfill({status:401,json:{error:'Sign in'}});});
 await page.goto('/?view=scan');
 await page.getByLabel('Upload or drop a manifest').setInputFiles({name:'requirements.txt',mimeType:'text/plain',buffer:Buffer.from('flask==3.0.0')});
 await page.getByText('Paste contents instead',{exact:true}).click();
 await expect(page.getByLabel('File format')).toHaveValue('requirements.txt');
 await expect(page.getByLabel('Manifest content')).toHaveValue('flask==3.0.0');
 await page.getByLabel('Upload or drop a manifest').setInputFiles({name:'requirements.txt',mimeType:'text/plain',buffer:Buffer.alloc(200001,65)});
 await expect(page.locator('main').getByRole('alert').filter({hasText:'200 KB'})).toContainText('200 KB');expect(scans).toBe(0);
 await page.getByLabel('Manifest content').fill(Array.from({length:51},(_,i)=>`package${i}==1.0.0`).join('\n'));
 await page.getByRole('button',{name:'Run scan',exact:true}).click();await expect(page.locator('main').getByRole('alert').filter({hasText:'50'})).toContainText('50');expect(scans).toBe(0);
});
test('mobile Scan action is not covered by navigation',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/?view=scan');const button=page.getByRole('button',{name:'Run scan',exact:true});await expect(button).toBeVisible();await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport({ratio:1});await button.click({trial:true});expect(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
});
