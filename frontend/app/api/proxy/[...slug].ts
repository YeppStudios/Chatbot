// pages/api/proxy/[...slug].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const API_URL = 'http://167.172.179.174';

const proxy = httpProxy.createProxyServer();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    // Proxy the request to your droplet backend
    proxy.web(req, res, { target: API_URL, changeOrigin: true }, (error) => {
      if (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy error', details: error.message });
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
