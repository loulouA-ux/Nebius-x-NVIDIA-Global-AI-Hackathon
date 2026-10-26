import {redirect} from 'next/navigation';
import Landing from './views/landing';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;const value=(key:string)=>typeof query[key]==='string'?query[key] as string:undefined;
 const view=value('view'),id=value('report'),finding=value('finding');
 if(view==='scan')redirect('/scan');if(view==='project')redirect('/hosts');
 if(id)redirect(`/reports/${encodeURIComponent(id)}${finding?`/findings/${encodeURIComponent(finding)}`:''}`);
 if(view)redirect('/reports');return <Landing/>;
}
