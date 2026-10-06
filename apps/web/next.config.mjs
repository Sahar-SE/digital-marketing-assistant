/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["@dma/shared-types", "@dma/feature-flags"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'fabric', 'utf-8-validate', 'bufferutil'];
    }
    return config;
  }
};

export default nextConfig;
