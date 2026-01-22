/**
 * Next.js App Component
 * 
 * Root component that wraps all pages. Sets up:
 * - tRPC client with authentication headers
 * - React Query for data fetching and caching
 * - Global styles
 */
import type { AppType } from "next/app";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../utils/trpc";
import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  // Create QueryClient instance (reused across renders)
  const [queryClient] = useState(() => new QueryClient());
  
  // Create tRPC client with authentication header
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc", // tRPC API endpoint
          headers() {
            // In production, get user ID from JWT token or secure cookie
            // For demo, we're using localStorage (not secure for production)
            return {
              "x-user-id": typeof window !== "undefined" 
                ? localStorage.getItem("userId") ?? "" 
                : "",
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export default MyApp;

