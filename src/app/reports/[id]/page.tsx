import {publicDemo} from "@/lib/server/public-demo";
import Workspace from '../../workspace';import {recordedDemo} from '@/lib/server/demo-report';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;return {title:'Scan report — ShipTested',alternates:{canonical:`/reports/${encodeURIComponent(id)}`}};}
export default async function Report({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Workspace demoOnly={publicDemo()} initialReport={id==='demo-recorded'?recordedDemo():undefined}/>;}
