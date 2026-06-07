import { supabase } from '@/lib/supabase';
import ShopProductClient from './ShopProductClient';
import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

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
    return { title: 'Product Not Found', description: 'The product you are looking for does not exist.' };
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
      images: product.image_url ? [{ url: product.image_url, alt: product.name }] : [],
      type: 'website',
    },
    alternates: { canonical: `${BASE_URL}/shop/${slug}` },
  };
}

export async function generateStaticParams() {
  const { data: products } = await supabase.from('products').select('slug');
  return (products || []).map((p) => ({ slug: p.slug }));
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!product) {
    return (
      <div className="min-h-screen bg-cr flex items-center justify-center">
        <p className="text-ink/30 text-xs uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    );
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
    brand: { '@type': 'Brand', name: 'NINOC' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      availability: product.price_tag === 'PREORDER'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/InStock',
      url: `${BASE_URL}/shop/${slug}`,
    },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ShopProductClient slug={slug} />
    </>
  );
}
