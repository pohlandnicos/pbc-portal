/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "",
  async redirects() {
    return [
      {
        source: '/app/:path*',
        destination: '/app/app/:path*',
        permanent: false
      }
    ];
  }
}

module.exports = nextConfig
