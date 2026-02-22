/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "",
  experimental: {
    appDir: true
  },
  async rewrites() {
    return [
      {
        source: '/app/:path*',
        destination: '/app/app/:path*'
      }
    ];
  }
}

module.exports = nextConfig
