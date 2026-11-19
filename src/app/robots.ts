import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  let rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (rawUrl.includes('supabase')) rawUrl = 'https://ninoc.store';
  if (!rawUrl.startsWith('http')) rawUrl = `https://${rawUrl}`;
  const baseUrl = rawUrl.replace(/\/+$/, '');

  return {
    rules: [
      // 1. OpenAI SearchBot (SearchGPT & ChatGPT Search indexing & citations)
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/checkout',
          '/login',
          '/onboarding',
        ],
      },
      // 2. ChatGPT User agent (Browsing & direct link retrieval)
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/checkout',
          '/login',
          '/onboarding',
        ],
      },
      // 3. OpenAI GPTBot (Foundation models & web intelligence)
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/checkout',
          '/login',
          '/onboarding',
        ],
      },
      // 4. Default Search Engines (Google, Bing, etc.)
      {
        userAgent: '*',
        allow: ['/', '/api/feed/google-merchant'],
        disallow: [
          '/api/',
          '/admin/',
          '/profile/orders/',
          '/checkout',
          '/login',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
