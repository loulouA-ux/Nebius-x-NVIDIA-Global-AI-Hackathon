import BrandHeader from './brand-header';
export default function NotFound() {
  return <><BrandHeader/><main id="main-content" className="not-found"><h1>Let’s get you back to the evidence.</h1><p>This page is unavailable. Your dashboard is the place to continue.</p><a className="button primary" href="/">Return to dashboard</a><a className="button" href="/reports">View recorded reports</a></main></>;
}
