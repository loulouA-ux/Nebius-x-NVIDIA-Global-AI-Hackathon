import styles from './partner-strip.module.css';
const providers = [
  { name: 'NVIDIA', logo: 'nvidia-logo-dark.svg', light: 'nvidia-logo-light.svg', label: 'Nemotron 3 Super', size: 'nvidia' },
  { name: 'Nebius', logo: 'nebius-white.svg', light: 'nebius-black.svg', label: 'Token Factory', size: 'nebius' },
  { name: 'Tavily', logo: 'tavily-full-offwhite.svg', light: 'tavily-full.svg', label: 'Search API', size: 'tavily' },
];

export default function PartnerStrip() {
  return (
    <section className={`partner-strip ${styles.strip}`} aria-label="AI providers">
      <p className="partner-strip-eyebrow">POWERED BY</p>
      <div className="partner-strip-grid">
        {providers.map(provider => (
          <div className="partner-strip-item" key={provider.name}>
            <div className="partner-logo-space">
              <img className={`partner-logo-${provider.size} theme-dark-logo`} src={`/partners/${provider.logo}`} alt={provider.name}/>
              <img className={`partner-logo-${provider.size} theme-light-logo`} src={`/partners/${provider.light}`} alt={provider.name}/>
            </div>
            <p className="partner-strip-label">{provider.label}</p>
          </div>
        ))}
      </div>
      <p className="partner-strip-source">Advisory data from OSV.dev</p>
    </section>
  );
}
