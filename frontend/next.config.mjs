import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  env: {
    HOAGIE_API_URL: process.env.HOAGIE_API_URL, // TODO: Fix this eventually (hooks can't access for some reason)
  },
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  }),
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    domains: ['github.com'],
  },
};

export default nextConfig;
