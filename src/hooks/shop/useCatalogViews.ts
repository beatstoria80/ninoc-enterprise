import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCatalogViews() {
  const { data, error, isLoading } = useSWR<{allViews: Record<string, number>}>(
    '/api/analytics/views?all=true',
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds for near-realtime
      revalidateOnFocus: true,
    }
  );

  return {
    allViews: data?.allViews ?? null,
    isLoading,
    isError: error,
  };
}
