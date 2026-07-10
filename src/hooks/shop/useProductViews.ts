import { useState, useEffect } from 'react';
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

  const [ticksPassed, setTicksPassed] = useState(0);

  // Accumulate count live every 1.5 seconds while viewing
  useEffect(() => {
    const interval = setInterval(() => {
      setTicksPassed((prev) => prev + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const baseViews = data?.views ?? null;
  const accumulatedViews = baseViews !== null ? baseViews + ticksPassed : null;

  return {
    views: accumulatedViews,
    isLoading,
    isError: error,
  };
}
