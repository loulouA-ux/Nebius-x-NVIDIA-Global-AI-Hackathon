import {Suspense} from 'react';
import SecurityDashboard from './security-dashboard';
export const metadata={title:'Security overview — ShipTested',robots:{index:false}};
export default function SecurityOverview(){return <Suspense fallback={null}><SecurityDashboard/></Suspense>;}
