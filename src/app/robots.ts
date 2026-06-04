import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.id';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/profile/orders/',
        '/checkout',
        '/login',
        '/onboarding',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
