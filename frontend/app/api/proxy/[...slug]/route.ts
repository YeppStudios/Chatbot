// app/api/proxy/[...slug]/route.ts

import { NextRequest } from 'next/server';

const API_URL = 'http://167.172.179.174:8000';

export const dynamic = 'force-dynamic';

type RouteParams = { params: { slug: string[] } };

export async function GET(req: NextRequest, { params }: RouteParams) {
  return proxyRequest(req, params.slug);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return proxyRequest(req, params.slug);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return proxyRequest(req, params.slug);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return proxyRequest(req, params.slug);
}

async function proxyRequest(req: NextRequest, slug?: string[]) {
  const path = slug ? slug.join('/') : '';
  const url = `${API_URL}/${path}`;

  const headers = new Headers(req.headers);
  headers.set('host', new URL(API_URL).host);

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
