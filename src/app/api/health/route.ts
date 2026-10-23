export async function GET() {
  return Response.json(
    {
      status: "local-prototype",
      providers: {
        tavily: Boolean(process.env.TAVILY_API_KEY),
        nebius: Boolean(process.env.NEBIUS_API_KEY),
      },
      persistence: false,
      urlScanning: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
