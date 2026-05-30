import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    // Exclude SSE stream route so that the custom Next.js route handler handles it (which supports streaming)
    if (request.nextUrl.pathname.endsWith("/stats/stream")) {
      return;
    }

    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8080";
    const backendUrl = rawBackendUrl.replace(/\/$/, "");
    
    // Parse target host from backend URL (e.g. "localhost:8080")
    let targetHost = "localhost:8080";
    try {
      const url = new URL(backendUrl);
      targetHost = url.host;
    } catch {
      console.error("Invalid backend URL:", backendUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("host", targetHost);

    // Keep the original path and query parameters
    const targetUrl = `${backendUrl}${request.nextUrl.pathname}${request.nextUrl.search}`;

    return NextResponse.rewrite(new URL(targetUrl), {
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: "/api/:path*",
};
