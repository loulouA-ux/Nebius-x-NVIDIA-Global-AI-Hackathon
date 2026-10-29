import {RootProvider} from 'fumadocs-ui/provider/next';
import localFont from 'next/font/local';
import type {ReactNode} from 'react';
import './global.css';
const body=localFont({src:'../../../../assets/fonts/inter.ttf',weight:'400 600',display:'swap',variable:'--font-body'});
const display=localFont({src:'../../../../assets/fonts/bricolagegrotesque.ttf',weight:'600',display:'swap',variable:'--font-display'});
const mono=localFont({src:'../../../../assets/fonts/jetbrainsmono.ttf',weight:'400 500',display:'swap',variable:'--font-mono'});
export const metadata={title:{default:'ShipTested documentation',template:'%s · ShipTested'},description:'Use the same evidence-led checks from your terminal, library or agent.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><body className={`${body.variable} ${display.variable} ${mono.variable} flex flex-col min-h-screen`}><RootProvider>{children}</RootProvider></body></html>;}
