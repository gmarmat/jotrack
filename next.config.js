/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["mammoth"],
  
  // Always use port 3000
  env: {
    PORT: '3000'
  },
  
  // Disable aggressive caching in development to prevent CSS loading issues
  ...(process.env.NODE_ENV === 'development' && {
    // Force CSS recompilation on every request
    webpack: (config, { isServer }) => {
      // Disable webpack caching in dev
      config.cache = false;
      return config;
    },
    // Disable SWC caching
    experimental: {
      swcMinify: true,
    },
  }),
}

module.exports = nextConfig

