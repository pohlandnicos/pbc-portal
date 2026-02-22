/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "",
  experimental: {
    appDir: true
  },
  async redirects() {
    return [
      {
        source: '/app/offers/:path*',
        destination: '/app/app/offers/:path*',
        permanent: true
      }
    ];
  }
}

module.exports = nextConfig
