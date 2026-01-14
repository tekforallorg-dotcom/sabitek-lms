// @ts-nocheck
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false

    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    })

    return config
  },
}

export default nextConfig