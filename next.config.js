/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: '250mb',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  cleanDistDir: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: '/tools/youtube-resizer',
        destination: '/tools/youtube-thumbnail-resizer',
        permanent: true,
      },
      {
        source: '/tools/tiktok-resizer',
        destination: '/tools/tiktok-video-resizer',
        permanent: true,
      },
      {
        source: '/tools/instagram-resizer',
        destination: '/tools/instagram-post-resizer',
        permanent: true,
      },
      {
        source: '/tools/twitter-resizer',
        destination: '/tools/twitter-header-resizer',
        permanent: true,
      },
      {
        source: '/tools/linkedin-resizer',
        destination: '/tools/linkedin-banner-resizer',
        permanent: true,
      },
      {
        source: '/tools/thumbnail-analyzer',
        destination: '/tools/youtube-thumbnail-analyzer',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
