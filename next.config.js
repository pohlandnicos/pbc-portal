/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "",
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
