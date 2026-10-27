// Verified public Vercel aliases; custom-domain DNS remains a separate handoff.
export const sitesLive=true;
export const docsLink=(page='index')=>`https://shiptested-docs.vercel.app/docs/${page==='index'?'':page}`;
