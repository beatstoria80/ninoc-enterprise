import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProductViews(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/analytics/views?slug=${slug}` : null,
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds for near-realtime
      revalidateOnFocus: true,
    }
  );

  return {
    views: data?.views ?? null,
    isLoading,
    isError: error,
  };
}
