/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    // Increase body size limit to 50MB for file uploads
    responseLimit: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'esiapizmdpylhotojfij.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
