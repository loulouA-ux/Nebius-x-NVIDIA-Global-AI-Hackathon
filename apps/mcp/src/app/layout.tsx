import type {ReactNode} from 'react';
import localFont from 'next/font/local';
import './global.css';
const body=localFont({src:'../../../../assets/fonts/inter.ttf',weight:'400 600',display:'swap',variable:'--font-body'});
const display=localFont({src:'../../../../assets/fonts/bricolagegrotesque.ttf',weight:'600',display:'swap',variable:'--font-display'});
const mono=localFont({src:'../../../../assets/fonts/jetbrainsmono.ttf',weight:'400 500',display:'swap',variable:'--font-mono'});
export const dynamic='force-dynamic';
export const metadata={title:'ShipTested MCP',description:'Deterministic dependency evidence for your agent.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body className={`${body.variable} ${display.variable} ${mono.variable}`}>{children}</body></html>;}
