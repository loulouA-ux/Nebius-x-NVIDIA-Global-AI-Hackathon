/** Sequential supervisor: bounded lifetime, no overlapping cycles or raw error logs. */
export async function workerLoop(options:{
  signal:AbortSignal; deadline:number; intervalMs:number; maxCycles:number;
  run:()=>Promise<void>; onError:()=>void;
  now?:()=>number; wait?:(milliseconds:number,signal:AbortSignal)=>Promise<void>;
}){
 const now=options.now??Date.now;
 if(!Number.isFinite(options.deadline)||!Number.isInteger(options.intervalMs)||options.intervalMs<1000||!Number.isInteger(options.maxCycles)||options.maxCycles<1)throw Error('Invalid worker bounds.');
 const wait=options.wait??((milliseconds,signal)=>new Promise<void>(resolve=>{
  const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',finish);resolve();};
  const timer=setTimeout(finish,milliseconds);signal.addEventListener('abort',finish,{once:true});
  if(signal.aborted)finish();
 }));
 let cycles=0,failures=0;
 while(!options.signal.aborted&&now()<options.deadline&&cycles<options.maxCycles){
  try{await options.run();}catch{failures++;options.onError();}
  cycles++;
  if(options.signal.aborted||cycles>=options.maxCycles)break;
  const remaining=options.deadline-now();if(remaining<=0)break;
  await wait(Math.min(options.intervalMs,remaining),options.signal);
 }
 return {cycles,failures};
}
