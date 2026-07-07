import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCatalogViews() {
  const { data, error, isLoading } = useSWR<{allViews: Record<string, number>}>(
    '/api/analytics/views?all=true',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  );

  return {
    allViews: data?.allViews ?? null,
    isLoading,
    isError: error,
  };
}
