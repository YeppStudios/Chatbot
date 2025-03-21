// app/api/proxy/[...rest]/route.ts
import { NextRequest } from 'next/server';

// Extend RequestInit to include duplex for streaming support
interface CustomRequestInit extends RequestInit {
  duplex?: 'half' | 'full';
}

const API_URL = 'http://167.172.179.174:8000';  // Nginx port

export const dynamic = 'force-dynamic';  // Force dynamic execution, no caching
export const revalidate = 0;  // Disable revalidation

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

export async function OPTIONS(req: NextRequest) {
  // Handle CORS preflight requests
  return new Response(null, {
    status: 204,  // No Content
    headers: {
      'Access-Control-Allow-Origin': '*',  // Adjust based on your CORS policy
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
      'Access-Control-Max-Age': '86400',  // Cache preflight for 24 hours
    },
  });
}

export async function HEAD(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const prefix = '/api/proxy';
  let subpath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  if (subpath.startsWith('/')) {
    subpath = subpath.slice(1);
  }

  const targetURL = new URL(subpath, API_URL);
  for (const [key, value] of searchParams.entries()) {
    targetURL.searchParams.append(key, value);
  }

  const method = req.method ?? 'GET';
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  // Detect streaming endpoints
  const isStreamingEndpoint = subpath.includes('ask-llm-conversation') || subpath.includes('ask-openai-assistant');

  const response = await fetch(targetURL.toString(), {
    method,
    headers: {
      ...Object.fromEntries(req.headers),
      ...(isStreamingEndpoint ? {
        'Accept': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      } : {}),
    },
    body,
    ...(isStreamingEndpoint ? { duplex: 'half' } : {}),  // Enable streaming for SSE
  } as CustomRequestInit);  // Cast to custom type to include duplex

  // Set response headers, preserving backend's Content-Type unless streaming
  const responseHeaders = new Headers(response.headers);
  if (isStreamingEndpoint) {
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');
  }

  // Add CORS headers for all responses
  responseHeaders.set('Access-Control-Allow-Origin', '*');  // Adjust as needed
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}