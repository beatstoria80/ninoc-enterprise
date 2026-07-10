import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProductViews(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/analytics/views?slug=${slug}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  return {
    views: data?.views ?? null,
    isLoading,
    isError: error,
  };
}
