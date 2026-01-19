// Bypass SSL verification for expired KRCG certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
