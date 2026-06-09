import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import CollectionLandingClient from './CollectionLandingClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!collection) {
    return { title: 'Collection Not Found | NINOC' };
  }

  return {
    title: `${collection.name} | NINOC Collections`,
    description: collection.description || `Discover the ${collection.name} collection at NINOC Studio.`,
  };
}

export default async function CollectionLandingPage({ params }: { params: { slug: string } }) {
  // We can fetch data here or in the client.
  // Since we rely on a lot of client-side animation and real-time feel,
  // we'll pass the slug to the client component and let it handle the data fetching.
  return <CollectionLandingClient slug={params.slug} />;
}
