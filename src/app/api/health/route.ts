export async function GET() {
  return Response.json(
    {
      status: "preview",
      providers: {
        tavily: Boolean(process.env.TAVILY_API_KEY),
        nebius: Boolean(process.env.NEBIUS_API_KEY),
      },
      persistence: Boolean(process.env.DATABASE_URL),
      memberAccess: Boolean(
        process.env.SHIPCHECK_PETER_KEY_HASH &&
          process.env.SHIPCHECK_LOUISE_KEY_HASH,
      ),
      urlScanning: false,
      note: "Configuration presence only; not a live provider or database health check.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
