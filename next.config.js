/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PB_URL: process.env.NEXT_PUBLIC_PB_URL,
  },
}

module.exports = nextConfig
