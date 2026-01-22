/**
 * tRPC React Client
 * 
 * Creates a type-safe React client for tRPC.
 * This provides full TypeScript type inference for all API endpoints.
 * 
 * Usage:
 *   const { data } = trpc.user.me.useQuery();
 *   const mutation = trpc.transaction.create.useMutation();
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../pages/api/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
