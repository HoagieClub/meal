'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** TanStack Query client for the whole app, created once per browser session. */
export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        // One retry keeps a dead backend from taking many seconds to show an error.
        defaultOptions: { queries: { retry: 1 } },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
