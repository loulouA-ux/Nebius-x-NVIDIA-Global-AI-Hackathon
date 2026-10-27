import {RootProvider} from 'fumadocs-ui/provider/next';
import {Bricolage_Grotesque,Inter,JetBrains_Mono} from 'next/font/google';
import type {ReactNode} from 'react';
import './global.css';
const body=Inter({subsets:['latin'],weight:['400','500','600'],variable:'--font-body'});
const display=Bricolage_Grotesque({subsets:['latin'],weight:'600',variable:'--font-display'});
const mono=JetBrains_Mono({subsets:['latin'],weight:['400','500'],variable:'--font-mono'});
export const metadata={title:{default:'ShipTested documentation',template:'%s · ShipTested'},description:'Use the same evidence-led checks from your terminal, library or agent.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><body className={`${body.variable} ${display.variable} ${mono.variable} flex flex-col min-h-screen`}><RootProvider>{children}</RootProvider></body></html>;}
