import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for pdf-parse to work in API routes
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  // next/image: allow Supabase Storage (course covers, logos, avatars) plus
  // the common OAuth avatar hosts so provider avatars keep loading.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jlylhwytecmhpaekffws.supabase.co', pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Turbopack config (Next.js 16 defaults to Turbopack)
  turbopack: {},
  // Webpack config for PDF.js worker support
  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false

    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    })

    return config
  },
}

export default nextConfig