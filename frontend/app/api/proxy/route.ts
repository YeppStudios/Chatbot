// app/api/proxy/route.ts

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

// 👇 ADD THESE TWO:
export async function OPTIONS(req: NextRequest) {
  return proxyRequest(req);
}

export async function HEAD(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  const { pathname, searchParams } = new URL(req.url);

  // Remove '/api/proxy' from the start of the path
  const prefix = '/api/proxy';
  let subpath = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length)
    : pathname;
  if (subpath.startsWith('/')) {
    subpath = subpath.slice(1);
  }

  // Build the final URL for your droplet
  const targetURL = new URL(subpath, API_URL);
  searchParams.forEach((value, key) => {
    targetURL.searchParams.append(key, value);
  });

  // If method is not GET/HEAD, forward the body
  const method = req.method || 'GET';
  const body =
    method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  // Proxy the request
  const response = await fetch(targetURL, {
    method,
    headers: req.headers,
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
