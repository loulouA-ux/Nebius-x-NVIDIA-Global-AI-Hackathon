import Link from 'next/link';
import Logo from './logo';
export default function Wordmark({intro=false}:{intro?:boolean}){return <Link className="brand" href="/" aria-label="ShipCheck home"><Logo intro={intro}/>ShipCheck</Link>}
