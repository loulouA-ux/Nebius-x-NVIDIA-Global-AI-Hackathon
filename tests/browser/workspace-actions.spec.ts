import {test,expect} from '@playwright/test';
test('workspace actions retain invitation evidence on failed revocation',async({page})=>{
 let workspace='team-a',members=[{actor_id:'github:1',role:'owner'},{actor_id:'github:2',role:'member'}],revokeFails=true;const actions:string[]=[];
 await page.route('**/api/**',r=>r.fulfill({json:{tokens:[],connected:false,installUrl:'https://github.com/apps/fixture/installations/new'}}));
 await page.route('**/api/workspaces',async r=>{
  if(r.request().method()==='POST'){
   const b=r.request().postDataJSON();actions.push(b.action);
   if(b.action==='switch')workspace=b.workspaceId;
   if(b.action==='remove')members=members.filter(m=>m.actor_id!==b.actorId);
   if(b.action==='invite')return r.fulfill({json:{id:'fixture-invite',token:'a'.repeat(64)}});
   if(b.action==='revokeInvite'&&revokeFails)return r.fulfill({status:503,json:{error:'Revocation unavailable. Try again.'}});
   return r.fulfill({json:{ok:true}});
  }
  return r.fulfill({json:{actor:{id:'github:1',workspaceId:workspace},workspaces:['team-a','team-b'].map(id=>({id,name:id,plan:'team',seat_limit:5,seats_used:members.length,role:'owner'})),members,events:[{sequence:1,event_type:'member_added',actor_id:'github:1',subject_id:'github:2',created_at:'2026-10-29T12:00:00Z'}]}});
 });
 await page.goto('/team');
 await page.getByLabel('Current workspace').selectOption('team-b');await expect(page.getByLabel('Current workspace')).toHaveValue('team-b');
 await page.getByRole('button',{name:'Remove member'}).click();await expect(page.getByRole('button',{name:'Remove member'})).toHaveCount(0);
 await page.getByLabel('GitHub account ID').fill('3');await page.getByRole('button',{name:'Create invitation'}).click();
 const code=page.locator('input[readonly]');await expect(code).toHaveValue('a'.repeat(64));
 await page.getByRole('button',{name:'Revoke invitation'}).click();await expect(page.locator('main').getByRole('alert')).toContainText('Revocation unavailable');await expect(code).toHaveValue('a'.repeat(64));
 revokeFails=false;await page.getByRole('button',{name:'Revoke invitation'}).click();await expect(code).toHaveCount(0);
 await page.getByLabel('Invitation code').fill('b'.repeat(64));await page.getByRole('button',{name:'Accept invitation'}).click();
 await page.getByText('Workspace audit history',{exact:true}).click();await expect(page.getByText(/member added/)).toBeVisible();
 expect(actions).toEqual(['switch','remove','invite','revokeInvite','revokeInvite','accept']);
});
