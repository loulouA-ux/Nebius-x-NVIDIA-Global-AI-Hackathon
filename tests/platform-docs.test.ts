import {it,expect} from 'vitest';
import {readdir,readFile} from 'node:fs/promises';
it('documentation internal links resolve to authored pages or real public assets',async()=>{
 const root='apps/docs/content/docs',files=await readdir(root),slugs=new Set(files.filter(f=>f.endsWith('.mdx')).map(f=>f.replace(/\.mdx$/,'')));let links=0;
 for(const file of files.filter(f=>f.endsWith('.mdx'))){const text=await readFile(`${root}/${file}`,'utf8');for(const match of text.matchAll(/\]\((\/[^)#]+)(?:#[^)]*)?\)/g)){links++;const target=match[1];if(target==='/docs')expect(slugs.has('index')).toBe(true);else if(target.startsWith('/docs/'))expect(slugs.has(target.slice(6)),`${file}: ${target}`).toBe(true);else await expect(readFile('apps/docs/public'+target)).resolves.toBeDefined();}}
 expect(links).toBeGreaterThan(5);
});
