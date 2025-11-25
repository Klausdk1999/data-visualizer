/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds (linting should be done in CI/local dev)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (type checking should be done in CI/local dev)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
