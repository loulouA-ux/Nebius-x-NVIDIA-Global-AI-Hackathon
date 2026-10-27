import {publicDemo} from "@/lib/server/public-demo";
import Workspace from '../../../../workspace';import {recordedDemo} from '@/lib/server/demo-report';
export default async function Finding({params}:{params:Promise<{id:string;findingId:string}>}){const {id,findingId}=await params;return <Workspace demoOnly={publicDemo()} initialReport={id==='demo-recorded'?recordedDemo():undefined} initialFinding={findingId}/>;}
