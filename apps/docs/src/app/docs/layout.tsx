import {PlatformBrand,PlatformIcon} from '../../../../shared/brand';
import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {source} from '../../lib/source';
import type {ReactNode} from 'react';
export default function Layout({children}:{children:ReactNode}){return <DocsLayout tree={source.pageTree} nav={{title:<PlatformBrand/>,url:'https://shiptested.com'}} links={[{text:'Documentation',url:'/docs',icon:<PlatformIcon kind="book"/>},{text:'Website',url:'https://shiptested.com'}]}>{children}</DocsLayout>;}
