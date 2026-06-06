import { supabase } from '@/lib/supabase';
import ShopProductClient from './ShopProductClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('name, description, price, image_url, category, price_tag')
    .eq('slug', slug)
    .single();

  if (!product) {
    return <ShopProductClient slug={slug} />;
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ShopProductClient slug={slug} />
    </>
  );
}
