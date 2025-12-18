'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense, useMemo } from 'react';

// Optimized QueryClient with better defaults for performance
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1, // Only retry once
        networkMode: 'offlineFirst', // Better offline support
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  });

// Keep a singleton for client-side
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  }
  // Browser: use singleton
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Use memo to prevent unnecessary re-renders
  const queryClient = useMemo(() => getQueryClient(), []);

  return (
    <SessionProvider 
      refetchOnWindowFocus={false} 
      refetchInterval={0}
      basePath="/api/auth"
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    </SessionProvider>
  );
}
