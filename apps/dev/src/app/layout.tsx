import {docsLink} from '../lib-platform';
import {headers} from 'next/headers';
import {Bricolage_Grotesque,Inter,JetBrains_Mono} from 'next/font/google';
import {Providers,ThemeToggle} from '../components/client';
import type {ReactNode} from 'react';
import './global.css';
const body=Inter({subsets:['latin'],weight:['400','500','600'],variable:'--font-body'});
const display=Bricolage_Grotesque({subsets:['latin'],weight:'600',variable:'--font-display'});
const mono=JetBrains_Mono({subsets:['latin'],weight:['400','500'],variable:'--font-mono'});
export const metadata={title:'ShipTested developers',description:'Run evidence-led checks in your terminal, application or agent.'};
export default async function Layout({children}:{children:ReactNode}){const nonce=(await headers()).get("x-nonce")||undefined;return <html lang="en" suppressHydrationWarning><body className={`${body.variable} ${display.variable} ${mono.variable}`}><Providers nonce={nonce}><a className="skip" href="#main">Skip to content</a><header><a className="wordmark" href="https://shiptested.com">ShipTested <span>Developers</span></a><nav aria-label="Main"><a href={docsLink()}>Docs</a><a href="/releases">Releases</a><ThemeToggle/></nav></header>{children}<footer><a href="https://shiptested.com">ShipTested</a><p>Evidence first. Human decisions.</p></footer></Providers></body></html>;}
