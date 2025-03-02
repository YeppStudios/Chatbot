// app/api/proxy/[...rest]/route.ts
import { NextRequest } from 'next/server';

const API_URL = 'http://167.172.179.174:8000';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}
export async function POST(req: NextRequest) {
  return proxyRequest(req);
}
export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}
export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}
// CORS preflight methods:
export async function OPTIONS(req: NextRequest) {
  return proxyRequest(req);
}
export async function HEAD(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  // nextUrl gives us full URL details
  const { pathname, searchParams } = req.nextUrl;
  // remove "/api/proxy" from the start
  const prefix = '/api/proxy';
  let subpath = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length)
    : pathname;
  // drop leading slash if present
  if (subpath.startsWith('/')) {
    subpath = subpath.slice(1);
  }

  // Build final URL to your droplet
  const targetURL = new URL(subpath, API_URL);

  // Copy query params over
  for (const [key, value] of searchParams.entries()) {
    targetURL.searchParams.append(key, value);
  }

  // Forward request body if method needs it
  const method = req.method ?? 'GET';
  let body: string | undefined = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.text();
  }

  // Proxy the request via fetch
  const response = await fetch(targetURL.toString(), {
    method,
    headers: req.headers,
    body,
  });

  // Respond with the droplet's response
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
