// Flip only after DNS and hosted checks succeed; source guides work before activation.
export const sitesLive=false;
const source='https://github.com/loulouA-ux/Nebius-x-NVIDIA-Global-AI-Hackathon/blob/codex/platform-docs/apps/docs/content/docs/';
export const docsLink=(page='index')=>sitesLive?`https://docs.shiptested.com/docs/${page==='index'?'':page}`:`${source}${page}.mdx`;
