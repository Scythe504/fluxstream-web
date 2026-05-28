import { NextRequest } from "next/server";
import http from "http";
import https from "https";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";
    const backendUrl = rawBackendUrl.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/torrents/${videoId}/stats/stream`;

    const client = targetUrl.startsWith("https") ? https : http;

    const stream = new ReadableStream({
      start(controller) {
        const req = client.get(targetUrl, {
          headers: {
            "Accept": "text/event-stream",
          }
        }, (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            controller.error(new Error(`Backend returned status ${res.statusCode}`));
            return;
          }

          res.on("data", (chunk) => {
            controller.enqueue(chunk);
          });

          res.on("end", () => {
            controller.close();
          });

          res.on("error", (err) => {
            controller.error(err);
          });
        });

        req.on("error", (err) => {
          controller.error(err);
        });

        // Close target request if the client disconnects
        if (request.signal.aborted) {
          req.destroy();
        } else {
          request.signal.addEventListener("abort", () => {
            req.destroy();
          });
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "none",
      },
    });
  } catch (error) {
    console.error("SSE stream proxy failed:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
