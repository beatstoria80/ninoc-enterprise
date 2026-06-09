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
  // We can fetch data here or in the client.
  // Since we rely on a lot of client-side animation and real-time feel,
  // we'll pass the slug to the client component and let it handle the data fetching.
  const resolvedParams = await params;
  return <CollectionLandingClient slug={resolvedParams.slug} />;
}
