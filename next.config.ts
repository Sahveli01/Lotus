import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @stellar/stellar-sdk runs server-side only (Node.js) — skip client bundling
  serverExternalPackages: ['@stellar/stellar-sdk'],
  turbopack: {
    // Tell Turbopack this project's root (avoids the multi-lockfile warning)
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
