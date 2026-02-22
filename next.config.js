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
        destination: '/app/app/:path*',
        has: [
          {
            type: 'query',
            key: '_next',
            value: undefined
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig
