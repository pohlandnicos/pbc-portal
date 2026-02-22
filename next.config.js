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
      },
      {
        source: '/app/customers/:path*',
        destination: '/app/app/customers/:path*',
        permanent: true
      },
      {
        source: '/app/projects/:path*',
        destination: '/app/app/projects/:path*',
        permanent: true
      },
      {
        source: '/app/invoices/:path*',
        destination: '/app/app/invoices/:path*',
        permanent: true
      },
      {
        source: '/app/protocols/:path*',
        destination: '/app/app/protocols/:path*',
        permanent: true
      },
      {
        source: '/app/tasks/:path*',
        destination: '/app/app/tasks/:path*',
        permanent: true
      },
      {
        source: '/app/settings/:path*',
        destination: '/app/app/settings/:path*',
        permanent: true
      }
    ];
  }
}

module.exports = nextConfig
