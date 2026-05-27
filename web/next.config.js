/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // Prevent workspace root detection warnings when multiple lockfiles exist
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
