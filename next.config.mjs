/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [

      {
        protocol: 'https',
        hostname: 'esiapizmdpylhotojfij.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      // Google Ads sitelink & common user-typed URL redirects
      { source: '/contact', destination: '/help', permanent: true },
      { source: '/hubungi', destination: '/help', permanent: true },
      { source: '/layanan', destination: '/help', permanent: true },
      { source: '/tentang', destination: '/about', permanent: true },
      { source: '/koleksi', destination: '/collections/apparel', permanent: true },
      { source: '/Koleksi', destination: '/collections/apparel', permanent: true },
      { source: '/Koleksi/:path*', destination: '/collections/:path*', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
