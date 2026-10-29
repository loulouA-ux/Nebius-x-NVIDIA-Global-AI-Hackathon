import {source} from '../../../lib/source';
import {DocsPage,DocsBody,DocsTitle,DocsDescription} from 'fumadocs-ui/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {CodeBlock,Pre} from 'fumadocs-ui/components/codeblock';
import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{slug?:string[]}>}){const {slug}=await params;const page=source.getPage(slug);if(!page)notFound();const MDX=page.data.body;let codeExample=0;return <DocsPage toc={page.data.toc} tableOfContent={{container:{role:"navigation","aria-label":"On this page"}}} tableOfContentPopover={{enabled:false}}><DocsTitle>{page.data.title}</DocsTitle><DocsDescription>{page.data.description}</DocsDescription><DocsBody><details className="mobile-contents"><summary>On this page</summary><nav aria-label="Page sections"><ul>{page.data.toc.map(item=><li key={item.url}><a href={item.url}>{item.title}</a></li>)}</ul></nav></details><MDX components={{...defaultMdxComponents,pre:({children,...props})=><CodeBlock {...props} viewportProps={{"aria-label":`${page.data.title}: code example ${++codeExample}`}}><Pre tabIndex={0}>{children}</Pre></CodeBlock>}}/></DocsBody></DocsPage>;}
export function generateStaticParams(){return source.generateParams();}
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}){const page=source.getPage((await params).slug);return {title:page?.data.title};}
