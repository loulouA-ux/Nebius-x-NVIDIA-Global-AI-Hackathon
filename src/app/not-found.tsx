import BrandHeader from './brand-header';
export default function NotFound() {
  return <><BrandHeader/><main className="not-found"><span className="eyebrow">404 / PAGE NOT FOUND</span><h1>Let’s get you back to the evidence.</h1><p>This page is unavailable. Your dashboard is the place to continue.</p><a className="button primary" href="/">Return to dashboard</a><a className="button" href="/repairs">Open repairs</a></main></>;
}
