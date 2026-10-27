import {timingSafeEqual} from 'node:crypto';
import {ApiError} from './http';
export function requireScheduler(request:Request){
  const secret=process.env.CRON_SECRET;
  if(!secret||secret.length<32)throw new ApiError(503,'Scheduler authentication is not configured.');
  const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(request.headers.get('authorization')||'');
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new ApiError(401,'Scheduler authentication required.');
}
