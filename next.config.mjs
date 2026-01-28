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
    ],
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
