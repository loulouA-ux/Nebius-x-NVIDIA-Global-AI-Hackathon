import Link from "next/link";
export default function BrandHeader() {
  return <header className="topbar">
    <Link className="brand" href="/" aria-label="ShipCheck home"><img className="brand-symbol" src="/brand/symbol.svg" alt="" width={48} height={42}/>ShipCheck</Link>
    <span className="tagline">Scan. Check. Ship.</span>

  </header>;
}
