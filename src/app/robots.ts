import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  let rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (rawUrl.includes('supabase')) rawUrl = 'https://ninoc.store';
  if (!rawUrl.startsWith('http')) rawUrl = `https://${rawUrl}`;
  const baseUrl = rawUrl.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/private/'],
      },
      // OpenAI Ecosystem (SearchGPT, ChatGPT User Browsing, Foundation Models)
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      // Search Engines
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      // Anthropic Claude
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      // Meta AI (Llama Web Indexer)
      {
        userAgent: 'meta-webindexer',
        allow: '/',
      },
      // Apple Intelligence (Siri & Safari AI Search)
      {
        userAgent: 'Applebot',
        allow: '/',
      },
      // DuckDuckGo AI Assistance
      {
        userAgent: 'DuckAssistBot',
        allow: '/',
      },
      // Amazon Rufus & E-Commerce AI
      {
        userAgent: 'Amzn-SearchBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
