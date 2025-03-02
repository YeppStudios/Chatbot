// app/api/proxy/[...slug]/route.ts

import { NextRequest } from 'next/server';

const API_URL = 'http://167.172.179.174:8000';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxyRequest(req, params.slug);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxyRequest(req, params.slug);
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxyRequest(req, params.slug);
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxyRequest(req, params.slug);
}

// General proxy handler
async function proxyRequest(req: NextRequest, slug: string[]) {
  const url = `${API_URL}/${slug.join('/')}`;

  const headers = new Headers(req.headers);
  headers.set('host', new URL(API_URL).host);

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const responseHeaders = new Headers(response.headers);

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
