import Landing from './views/landing';
import Workspace from './workspace';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const query=await searchParams;
 return Object.keys(query).some(k=>['view','report','finding'].includes(k))?<Workspace/>:<Landing/>;
}
