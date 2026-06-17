import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import CollectionLandingClient from './CollectionLandingClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!collection) {
    return { title: 'Collection Not Found | NINOC' };
  }

  return {
    title: `${collection.name} | NINOC Collections`,
    description: collection.description || `Discover the ${collection.name} collection at NINOC Studio.`,
  };
}

export default async function CollectionLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (colError || !collection) {
    return <CollectionLandingClient slug={resolvedParams.slug} initialCollection={null} initialProducts={[]} />;
  }

  // Fetch Products relation
  const { data: relData } = await supabase
    .from('collection_products')
    .select('product_id')
    .eq('collection_id', collection.id);

  let products = [];
  if (relData && relData.length > 0) {
    const productIds = relData.map(r => r.product_id);
    const { data: prodData } = await supabase
      .from('products')
      .select('*, variants(*)')
      .in('id', productIds);
      
    if (prodData) {
      products = prodData;
    }
  }

  return <CollectionLandingClient slug={resolvedParams.slug} initialCollection={collection} initialProducts={products} />;
}
