// Bypass SSL verification for expired KRCG certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors/warnings. These should be fixed later.
    ignoreDuringBuilds: true,
  },
  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images - optimized for common breakpoints
    deviceSizes: [
      640,  // mobile
      750,  // mobile landscape
      828,  // small tablet
      1080, // tablet/large phone
      1200, // small desktop
      1920, // desktop HD
      2048, // desktop 2K
    ],
    // Image sizes for srcset generation
    imageSizes: [
      16, 32, 48, 64, 96, 128, 256, 384
    ],
    // Cache optimization
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allow cross-origin images for avatars and thumbnails
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.krcg.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vdb-images.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vbdb.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i1.sndcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // VTES Guess redirects - old /vtes/ routes to new /vtes-guess/ routes
      {
        source: '/vtes/guess-card',
        destination: '/vtes-guess/guess-card',
        permanent: true,
      },
      {
        source: '/vtes/leaderboard',
        destination: '/vtes-guess/leaderboard',
        permanent: true,
      },
      {
        source: '/vtes/mask-debug',
        destination: '/vtes-guess/mask-debug',
        permanent: true,
      },
      {
        source: '/vtes/test-image',
        destination: '/vtes-guess/test-image',
        permanent: true,
      },
      // VTES Tracker redirects - old /vtes/ routes to new /vtes-tracker/ routes
      {
        source: '/vtes',
        destination: '/vtes-tracker',
        permanent: true,
      },
      {
        source: '/vtes/cards',
        destination: '/vtes-tracker/cards',
        permanent: true,
      },
      {
        source: '/vtes/decks',
        destination: '/vtes-tracker/decks',
        permanent: true,
      },
      {
        source: '/vtes/players/:path*',
        destination: '/vtes-tracker/players/:path*',
        permanent: true,
      },
      {
        source: '/vtes/sessions',
        destination: '/vtes-tracker/sessions',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
