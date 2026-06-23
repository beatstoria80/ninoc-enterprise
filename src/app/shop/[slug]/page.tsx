import { supabase } from '@/lib/supabase';
import ShopProductClient from './ShopProductClient';
import { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, category, price_tag')
    .eq('slug', slug)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Beli ${product.name} dari NINOC — Premium Archival Garment Studio. IDR ${product.price?.toLocaleString('id-ID')}.`;

  return {
    title: `${product.name} — Premium Archival Garment`,
    description,
    openGraph: {
      title: `${product.name} | NINOC STORE`,
      description,
      images: product.image_url ? [{ 
        url: product.image_url, 
        width: 1080,
        height: 1080,
        alt: product.name 
      }] : [],
      type: 'website',
      siteName: 'NINOC STORE',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | NINOC STORE`,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/shop/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  const { data: products } = await supabase
    .from('products')
    .select('slug');

  return (products || []).map((product) => ({
    slug: product.slug,
  }));
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*, variants(*)')
    .eq('slug', slug)
    .single();

  if (!product) {
    const dict = await getDictionary();
    return <ShopProductClient slug={slug} dict={dict} initialReviews={[]} />;
  }

  const { data: reviews } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', product.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  let aggregateRating;
  let reviewSchema;
  
  if (reviews && reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
    
    aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1
    };

    reviewSchema = reviews.map(r => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        '@type': 'Person',
        name: r.author_name
      },
      datePublished: new Date(r.created_at).toISOString().split('T')[0],
      reviewBody: r.review_text || ''
    }));
  }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Beli ${product.name} dari NINOC — Premium Archival Garment Studio. IDR ${product.price?.toLocaleString('id-ID')}.`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.image_url ? [product.image_url] : [],
    url: `${BASE_URL}/shop/${slug}`,
    sku: slug,
    category: product.category || 'Apparel',
    brand: { '@type': 'Brand', name: 'NINOC' },
    manufacturer: {
      '@type': 'Organization',
      name: 'NINOC Enterprise',
      address: 'Bandung, Indonesia'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.price_tag === 'PREORDER'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock',
      url: `${BASE_URL}/shop/${slug}`,
      seller: {
        '@type': 'Organization',
        name: 'NINOC STORE',
      }
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviewSchema ? { review: reviewSchema } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${BASE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/shop/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ShopProductClient slug={slug} dict={await getDictionary()} initialProduct={product} initialReviews={reviews || []} />
    </>
  );
}
