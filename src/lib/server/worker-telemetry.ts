import {randomUUID} from 'node:crypto';
import type {Query} from './db';
export async function observeWorker<T extends {processed:boolean}>(query:Query,kind:'scan'|'billing',run:()=>Promise<T>) {
  const id=randomUUID(),started=Date.now();
  await query('INSERT INTO sc_worker_runs(id,kind,state) VALUES($1,$2,\'running\')',[id,kind]);
  try {const result=await run();await query("UPDATE sc_worker_runs SET state='completed',finished_at=now(),duration_ms=$2,processed=$3 WHERE id=$1",[id,Date.now()-started,result.processed]);return result;}
  catch(error){await query("UPDATE sc_worker_runs SET state='failed',finished_at=now(),duration_ms=$2 WHERE id=$1",[id,Date.now()-started]);throw error;}
}
