import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ShopProductClient from './ShopProductClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, category, price_tag')
    .eq('slug', slug)
    .single();

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = `${product.name}${product.price_tag ? ` — ${product.price_tag}` : ''}`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `Beli ${product.name} dari NINOC — Premium Archival Garment Studio. IDR ${product.price?.toLocaleString('id-ID')}.`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${baseUrl}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${baseUrl}/shop/${slug}` },
    ],
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.image_url ? [product.image_url] : [],
    url: `${baseUrl}/shop/${slug}`,
    brand: { '@type': 'Brand', name: 'NINOC' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      availability: product.price_tag === 'PREORDER'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock',
      url: `${baseUrl}/shop/${slug}`,
    },
  };

  return {
    title,
    description,
    openGraph: {
      title: `${product.name} | NINOC STORE`,
      description,
      url: `${baseUrl}/shop/${slug}`,
      images: product.image_url
        ? [{ url: product.image_url, width: 800, height: 800, alt: product.name }]
        : [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | NINOC STORE`,
      description,
      images: product.image_url
        ? [product.image_url]
        : [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: `${baseUrl}/shop/${slug}`,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [productSchema, breadcrumbSchema],
      }),
    },
  };
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;
  return <ShopProductClient slug={slug} />;
}