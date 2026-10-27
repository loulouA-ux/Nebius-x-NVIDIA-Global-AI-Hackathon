import type {ReactNode} from 'react';
import {Bricolage_Grotesque,Inter,JetBrains_Mono} from 'next/font/google';
import './global.css';
const body=Inter({subsets:['latin'],weight:['400','500','600'],variable:'--font-body'});
const display=Bricolage_Grotesque({subsets:['latin'],weight:'600',variable:'--font-display'});
const mono=JetBrains_Mono({subsets:['latin'],weight:['400','500'],variable:'--font-mono'});
export const dynamic='force-dynamic';
export const metadata={title:'ShipTested MCP',description:'Deterministic dependency evidence for your agent.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body className={`${body.variable} ${display.variable} ${mono.variable}`}>{children}</body></html>;}
