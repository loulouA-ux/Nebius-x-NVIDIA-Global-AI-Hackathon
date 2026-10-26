import {test,expect} from '@playwright/test';
test('upload detects format and blocks oversized files before requests',async({page})=>{
 let scans=0;await page.route('**/api/scans',r=>{scans++;return r.fulfill({status:401,json:{error:'Sign in'}});});
 await page.goto('/?view=scan');
 await page.getByLabel('Upload or drop a manifest').setInputFiles({name:'requirements.txt',mimeType:'text/plain',buffer:Buffer.from('flask==3.0.0')});
 await expect(page.getByLabel('File format')).toHaveValue('requirements.txt');
 await expect(page.getByLabel('Manifest content')).toHaveValue('flask==3.0.0');
 await page.getByLabel('Upload or drop a manifest').setInputFiles({name:'requirements.txt',mimeType:'text/plain',buffer:Buffer.alloc(200001,65)});
 await expect(page.locator('main').getByRole('alert')).toContainText('200 KB');expect(scans).toBe(0);
 await page.getByLabel('Manifest content').fill(Array.from({length:51},(_,i)=>`package${i}==1.0.0`).join('\n'));
 await page.getByRole('button',{name:'Scan',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText('50');expect(scans).toBe(0);
});
