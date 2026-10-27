'use client';
import Link from 'next/link';import Logo from './components/logo';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main-content" className="legal-page"><Logo size={48}/><h1>This page could not load.</h1><p>No result is reported as clean. Try again or return to the recorded reports.</p><button className="button" onClick={reset}>Try again</button> <Link className="button" href="/reports">View reports</Link></main>}
