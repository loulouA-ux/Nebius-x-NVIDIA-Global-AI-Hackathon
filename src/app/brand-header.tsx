export default function BrandHeader() {
  return <header className="topbar">
    <a className="brand" href="/" aria-label="ShipCheck home"><img className="brand-symbol" src="/brand/symbol.svg" alt="" width={48} height={42}/>ShipCheck</a>
    <span className="tagline">Scan. Check. Ship.</span>
    <span className="build-badge">Protected preview</span>
  </header>;
}
