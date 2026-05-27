import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";
    const backendUrl = rawBackendUrl.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/torrents/${videoId}/stats/stream`;

    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "text/event-stream",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return new Response(`Backend returned status ${response.status}`, { status: response.status });
    }

    if (!response.body) {
      return new Response("Backend stream body is empty", { status: 500 });
    }

    // Stream the body chunk-by-chunk using a stream-compatible Response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE stream proxy failed:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
