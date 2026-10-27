import {open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,isAbsolute,basename,sep} from 'node:path';
export async function readLocalLockfile(path:string,cwd=process.cwd()){
 if(path.split(/[\\/]/).includes('..')||isAbsolute(path))throw Error('Path must stay inside the working directory.');
 const root=await realpath(cwd),target=await realpath(resolve(root,path)),rel=relative(root,target);
 if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('Path escapes the working directory.');
 if(!['package-lock.json','package.json','requirements.txt'].includes(basename(target)))throw Error('Unsupported input filename.');
 const file=await open(target,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>2_000_000)throw Error('Input exceeds limit.');const bytes=Buffer.alloc(2_000_001);let size=0;
 while(size<bytes.length){const {bytesRead}=await file.read(bytes,size,bytes.length-size,null);if(!bytesRead)break;size+=bytesRead;}
 if(size>2_000_000)throw Error('Input exceeds limit.');return {lockfile:bytes.subarray(0,size).toString('utf8'),filename:basename(target)};
 }finally{await file.close();}
}
