import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The kernel talks to Postgres directly; keep the drivers out of the bundler.
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
}

export default nextConfig
