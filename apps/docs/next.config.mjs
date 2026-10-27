import {createMDX} from 'fumadocs-mdx/next';
import {resolve} from 'node:path';
export default createMDX()({turbopack:{root:resolve(import.meta.dirname,'../..')},poweredByHeader:false});
