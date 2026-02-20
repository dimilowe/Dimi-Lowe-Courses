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
        source: '/tools',
        destination: '/store',
        permanent: true,
      },
      {
        source: '/tools/:path*',
        destination: '/store',
        permanent: true,
      },
      {
        source: '/clouds',
        destination: '/store',
        permanent: true,
      },
      {
        source: '/clouds/:path*',
        destination: '/store',
        permanent: true,
      },
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
        source: '/admin/content-manager',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/content-factory',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/cms-import',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/seo-control',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/seo-health',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/indexing',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/ready-to-index',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/tools',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/engines',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/clusters/:path*',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/brand-access',
        destination: '/admin/products',
        permanent: false,
      },
      {
        source: '/admin/articles/:path*',
        destination: '/admin/products',
        permanent: false,
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
  async headers() {
    return [
      {
        source: "/tools",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/categories/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/clusters/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/queries/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/image-size-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/file-convert-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/unit-convert-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/pdf-task-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/image-format-convert-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tools/calculator-bank",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
