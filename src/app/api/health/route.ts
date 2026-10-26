import {publicDemo} from '@/lib/server/public-demo';
export async function GET() {
  return Response.json(
    {
      status: publicDemo()?"demo":"preview",
      publicDemo: publicDemo(),
      providers: {
        tavily: !publicDemo() && Boolean(process.env.TAVILY_API_KEY),
        nebius: !publicDemo() && Boolean(process.env.NEBIUS_API_KEY),
      },
      persistence: Boolean(process.env.DATABASE_URL),
      memberAccess: Boolean(
        process.env.SHIPCHECK_PETER_KEY_HASH &&
          process.env.SHIPCHECK_LOUISE_KEY_HASH,
      ),
      urlScanning: !publicDemo(),
      note: "Configuration presence only; not a live provider or database health check.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
