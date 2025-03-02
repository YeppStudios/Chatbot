// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const API_URL = 'http://167.172.179.174:8000';  // your droplet base URL

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

// Generic proxy handler
async function proxyRequest(req: NextRequest) {
  // 1. Parse the incoming request URL
  const { pathname, searchParams } = new URL(req.url);

  // 2. Remove the "/api/proxy" prefix to get subpath
  const prefix = '/api/proxy';
  let subpath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  // Remove a leading slash if it exists
  if (subpath.startsWith('/')) {
    subpath = subpath.slice(1);
  }

  // 3. Construct the target URL (Droplet) with the subpath
  const targetURL = new URL(subpath, API_URL);

  // 4. Merge search params
  searchParams.forEach((value, key) => {
    targetURL.searchParams.append(key, value);
  });

  // 5. Forward the request body (if not GET/HEAD)
  const method = req.method;
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  // 6. Proxy the request via fetch
  const response = await fetch(targetURL, {
    method,
    headers: new Headers(req.headers),
    body,
  });

  // 7. Return the proxied response
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
