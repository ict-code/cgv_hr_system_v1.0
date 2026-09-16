"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // No defaults before this meant staleTime=0 — every query was
            // "stale" the instant it landed, so every remount/tab-switch/nav
            // back to an already-visited page refetched from scratch even
            // though shared data (departments, positions, appointment
            // statuses, etc.) rarely changes within a session. 60s keeps
            // navigation-triggered refetches from duplicating in-flight
            // requests for the same query key without going stale for long.
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
