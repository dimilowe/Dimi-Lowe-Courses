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
        source: '/shopping/buylens',
        destination: '/tools/buylens',
        permanent: true,
      },
      {
        source: '/products',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/store/vcm-creation-cloud',
        destination: '/clouds/creation-cloud',
        permanent: true,
      },
      {
        source: '/product/:slug',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/products/nudge',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/products/qrsocial',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/products/stemly',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/products/ape',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/products/cscorecals',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/newsletter',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/newsletter',
        permanent: true,
      },
      {
        source: '/mbb/:slug',
        destination: '/newsletter',
        permanent: true,
      },
      {
        source: '/newsletter/qr-code-monkey-vs-qr-social-which-is-better-for-your-business',
        destination: '/newsletter',
        permanent: true,
      },
      {
        source: '/articles/maintenance-vs-deficit-vs-surplus',
        destination: '/tools/calorie-counter-maintenance',
        permanent: true,
      },
      {
        source: '/articles/what-are-maintenance-calories',
        destination: '/tools/calorie-counter-maintenance',
        permanent: true,
      },
      {
        source: '/articles/walking-for-fat-loss',
        destination: '/tools/calorie-counter-walking',
        permanent: true,
      },
      {
        source: '/tools/instagram-story-size',
        destination: '/tools/instagram-story-resizer',
        permanent: true,
      },
      {
        source: '/tools/youtube-thumbnail-size',
        destination: '/tools/youtube-thumbnail-resizer',
        permanent: true,
      },
      {
        source: '/tools/tdee-calculator',
        destination: '/tools/calorie-counter-maintenance',
        permanent: true,
      },
      {
        source: '/tools/linkedin-banner-size',
        destination: '/tools/linkedin-banner-resizer',
        permanent: true,
      },
      {
        source: '/tools/maintenance-calorie-calculator',
        destination: '/tools/calorie-counter-maintenance',
        permanent: true,
      },
      {
        source: '/tools/walking-calories-burned',
        destination: '/tools/calorie-counter-walking',
        permanent: true,
      },
      {
        source: '/tools/steps-to-calories',
        destination: '/tools/calorie-counter-steps',
        permanent: true,
      },
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
