import BrandHeader from './brand-header';
import MarkScene from './components/voyage/mark-scene';
export default function NotFound(){return <><BrandHeader/><main id="main-content" className="not-found"><MarkScene variant="missing"/><h1>Page not found</h1><p>This address has no page. Open Reports to return to the evidence.</p><a className="button primary" href="/reports">View reports</a></main></>}
