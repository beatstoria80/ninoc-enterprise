import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProductViews(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/analytics/views?slug=${slug}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  );

  return {
    views: data?.views ?? null, // null means we shouldn't render it
    isLoading,
    isError: error,
  };
}
