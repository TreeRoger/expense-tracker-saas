/**
 * Next.js API Route Handler for tRPC
 * 
 * This file creates the Next.js API endpoint at /api/trpc/[trpc]
 * that handles all tRPC requests. The [trpc] dynamic route captures
 * the procedure path (e.g., "user.login", "transaction.list").
 * 
 * This is the entry point for all tRPC API calls from the frontend.
 */
import * as trpcNext from "@trpc/server/adapters/next";
import { appRouter } from "./router";
import { createContext } from "./context";

/**
 * tRPC API Handler
 * 
 * Configures tRPC to work with Next.js API routes:
 * - router: The main application router
 * - createContext: Function to create context for each request
 * - onError: Error logging (only in development for security)
 */
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  // Only log errors in development to avoid exposing sensitive info in production
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
        }
      : undefined,
});
