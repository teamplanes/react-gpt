/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // eslint-disable-next-line no-param-reassign
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/openai/:path*',
        destination: '/api/openai',
      },
    ];
  },
};

module.exports = nextConfig;
