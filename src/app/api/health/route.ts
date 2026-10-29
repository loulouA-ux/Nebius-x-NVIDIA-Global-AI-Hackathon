import { brandEnv } from "../../../lib/brand-env";
import {publicDemo} from '@/lib/server/public-demo';
export async function GET() {
  return Response.json(
    {
      status: publicDemo()?"demo":process.env.VERCEL_ENV==="production"?"production":"preview",
      publicDemo: publicDemo(),
      providers: {
        tavily: !publicDemo() && Boolean(process.env.TAVILY_API_KEY),
        nebius: !publicDemo() && Boolean(process.env.NEBIUS_API_KEY),
      },
      persistence: !publicDemo() && Boolean(process.env.DATABASE_URL),
      memberAccess: !publicDemo() && Boolean(
        brandEnv("PETER_KEY_HASH") &&
          brandEnv("LOUISE_KEY_HASH"),
      ),
      urlScanning: !publicDemo(),
      note: "Configuration presence only; not a live provider or database health check.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
