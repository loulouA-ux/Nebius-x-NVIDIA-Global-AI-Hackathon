import {PlatformBrand} from '../../../shared/brand';
import Link from 'next/link';
export default function NotFound(){return <main className="platform-home"><a className="brand-home" href="https://shiptested.com" aria-label="ShipTested home"><PlatformBrand/></a><h1>Here be no pages.</h1><p>This page is outside the chart. Return to the documentation and choose a guide.</p><Link href="/docs">Back to documentation</Link></main>;}
