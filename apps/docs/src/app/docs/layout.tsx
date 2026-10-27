import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {source} from '../../lib/source';
import type {ReactNode} from 'react';
export default function Layout({children}:{children:ReactNode}){return <DocsLayout tree={source.pageTree} nav={{title:<><img className="platform-logo" src="/brand/shiptested-mark-light-bg.svg" alt=""/>ShipTested</>,url:'https://shiptested.com'}} links={[{text:'Documentation',url:'/docs'},{text:'Website',url:'https://shiptested.com'}]}>{children}</DocsLayout>;}
