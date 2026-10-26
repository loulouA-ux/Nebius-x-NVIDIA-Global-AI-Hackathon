const providers = [
  { name: 'NVIDIA', logo: 'nvidia-logo-horz.svg', label: 'Nemotron 3 Super', size: 'nvidia' },
  { name: 'Nebius', logo: 'nebius-color.svg', label: 'Token Factory', size: 'nebius' },
  { name: 'Tavily', logo: 'tavily-full.svg', label: 'Search API', size: 'tavily' },
];

export default function PartnerStrip() {
  return (
    <section className="partner-strip" aria-label="AI providers">
      <p className="partner-strip-eyebrow">POWERED BY</p>
      <div className="partner-strip-grid">
        {providers.map(provider => (
          <div className="partner-strip-item" key={provider.name}>
            <div className="partner-strip-tile">
              <img className={`partner-logo-${provider.size}`} src={`/partners/${provider.logo}`} alt={provider.name}/>
            </div>
            <p className="partner-strip-label">{provider.label}</p>
          </div>
        ))}
      </div>
      <p className="partner-strip-source">Advisory data from OSV.dev</p>
    </section>
  );
}
