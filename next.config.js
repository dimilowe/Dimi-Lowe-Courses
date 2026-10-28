/** @type {import('next').NextConfig} */
const nextConfig = {
  // Replit provisions Clerk's public key under CLERK_PUBLISHABLE_KEY.
  // Next's Clerk SDK reads the conventional NEXT_PUBLIC name.
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_CLERK_PROXY_URL: process.env.CLERK_PROXY_URL || '',
  },
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
      { source: '/forgot-password', destination: '/sign-in', permanent: false },
      { source: '/forgot-username', destination: '/sign-in', permanent: false },
      { source: '/reset-password', destination: '/sign-in', permanent: false },
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
        destination: '/store',
        permanent: true,
      },
      {
        source: '/store/vcm-creation-cloud',
        destination: '/clouds/creation-cloud',
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
        destination: '/store',
        permanent: true,
      },
      {
        source: '/articles/what-are-maintenance-calories',
        destination: '/store',
        permanent: true,
      },
      {
        source: '/articles/walking-for-fat-loss',
        destination: '/store',
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
