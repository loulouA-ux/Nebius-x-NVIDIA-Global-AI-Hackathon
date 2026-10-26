import Link from 'next/link';
import {ShieldCheck} from 'lucide-react';
export default function Wordmark(){return <Link className="brand" href="/" aria-label="ShipCheck home"><ShieldCheck size={27} strokeWidth={1.8} aria-hidden="true"/>ShipCheck</Link>}
