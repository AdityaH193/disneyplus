/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['image.tmdb.org', 'www.themoviedb.org', 'img.youtube.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  output: 'standalone',
}

module.exports = nextConfig