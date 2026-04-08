/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: '**.bookbrainz.org' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'i.gr-assets.com' },
      { protocol: 'https', hostname: '**.goodreads.com' },
      { protocol: 'https', hostname: 'wfnneweepjxbzghettwb.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
