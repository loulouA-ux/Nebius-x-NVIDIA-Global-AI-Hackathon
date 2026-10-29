"use client";
import {X as UiX} from 'lucide-react';

import Voyage from './voyage/voyage';
import {useEffect,useState} from 'react';
export default function ScanProgress({cancel}:{cancel?:()=>void}){const [elapsed,setElapsed]=useState(0);useEffect(()=>{const start=Date.now();const id=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);return()=>clearInterval(id);},[]);return <section className="scan-progress"><h1>Scan in progress</h1><div className="scan-indicator"><p role="status">Request running · {elapsed}s elapsed</p></div><p>Checks update when the report arrives. Timeouts are marked Incomplete.</p><Voyage mode="scan" events={[]}/>{cancel&&<><button className="button" onClick={cancel}><UiX size={16} aria-hidden="true" className="action-icon"/>Cancel waiting</button><p>Stops waiting here. The server may still finish and save the scan.</p></>}</section>}
