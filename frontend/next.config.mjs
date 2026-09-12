/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next lint` (and the build) only look in a few folders by default; hooks, tests and types
  // live elsewhere. Type and lint errors fail the build, so a broken change cannot deploy.
  eslint: {
    dirs: ['app', 'components', 'hooks', 'lib', 'e2e', 'types', 'test'],
  },
};

export default nextConfig;
