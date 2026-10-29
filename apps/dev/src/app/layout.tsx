import {PlatformBrand,PlatformIcon} from '../../../shared/brand';
import {docsLink} from '../lib-platform';
import {headers} from 'next/headers';
import localFont from 'next/font/local';
import {Providers,ThemeToggle} from '../components/client';
import type {ReactNode} from 'react';
import './global.css';
const body=localFont({src:'../../../../assets/fonts/inter.ttf',weight:'400 600',display:'swap',variable:'--font-body'});
const display=localFont({src:'../../../../assets/fonts/bricolagegrotesque.ttf',weight:'600',display:'swap',variable:'--font-display'});
const mono=localFont({src:'../../../../assets/fonts/jetbrainsmono.ttf',weight:'400 500',display:'swap',variable:'--font-mono'});
export const metadata={title:'ShipTested developers',description:'Run evidence-led checks in your terminal, application or agent.'};
export default async function Layout({children}:{children:ReactNode}){const nonce=(await headers()).get("x-nonce")||undefined;return <html lang="en" suppressHydrationWarning><body className={`${body.variable} ${display.variable} ${mono.variable}`}><Providers nonce={nonce}><a className="skip" href="#main">Skip to content</a><header><a className="wordmark" href="https://shiptested.com"><PlatformBrand/><small>Developers</small></a><nav aria-label="Main"><a href={docsLink()}><PlatformIcon kind="book"/> Docs</a><a href="/releases"><PlatformIcon kind="history"/> Releases</a><ThemeToggle/></nav></header>{children}<footer><a className="wordmark" href="https://shiptested.com"><PlatformBrand/></a><p>Evidence first. Human decisions.</p></footer></Providers></body></html>;}
