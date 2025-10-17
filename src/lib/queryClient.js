import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
      staleTime: 30 * 1000, // Data stays fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    },
    mutations: {
      retry: false, // Don't retry failed mutations
    },
  },
});
