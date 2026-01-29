import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for pdf-parse to work in API routes
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

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