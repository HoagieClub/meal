import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  }),
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    domains: ['github.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
