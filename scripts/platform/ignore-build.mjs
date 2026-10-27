import {execFileSync} from 'node:child_process';
const app=process.argv[2],base=process.env.VERCEL_GIT_PREVIOUS_SHA,head=process.env.VERCEL_GIT_COMMIT_SHA;
if(!['web','docs','dev','mcp'].includes(app)||!base||!head||!(/^[a-f0-9]{40}$/i.test(base)&&/^[a-f0-9]{40}$/i.test(head)))process.exit(1);
try{const paths=execFileSync('git',['diff','--name-only',base,head],{encoding:'utf8'}).trim().split('\n');const shared=['package.json','package-lock.json','packages/','scripts/platform/'];const own=app==='web'?['src/','public/','fixtures/','next.config','tsconfig','proxy','vercel.json']:[`apps/${app}/`,'fixtures/'];const rebuild=paths.some(path=>[...shared,...own].some(prefix=>path.startsWith(prefix)));process.exit(rebuild?1:0);}catch{process.exit(1);}
