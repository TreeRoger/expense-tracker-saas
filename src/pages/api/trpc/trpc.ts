/**
 * tRPC Setup and Middleware
 * 
 * Configures tRPC with authentication and authorization middleware.
 * Provides three types of procedures:
 * - publicProcedure: No authentication required
 * - protectedProcedure: Requires user authentication
 * - adminProcedure: Requires admin role
 */
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { Role } from "@prisma/client";

// Initialize tRPC with our Context type
const t = initTRPC.context<Context>().create();

// Export router and base procedure
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Authentication Middleware
 * 
 * Checks if the user is authenticated by verifying session exists.
 * Throws UNAUTHORIZED error if user is not logged in.
 * 
 * Used by: protectedProcedure, adminProcedure
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  // Pass context with guaranteed session to next procedure
  return next({
    ctx: {
      ...ctx,
      session: ctx.session, // TypeScript now knows session is not null
    },
  });
});

/**
 * Admin Authorization Middleware
 * 
 * Checks if the user is authenticated AND has ADMIN role.
 * Throws UNAUTHORIZED if not logged in, FORBIDDEN if not admin.
 * 
 * Used by: adminProcedure
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  // First check authentication
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  // Then check admin role
  if (ctx.session.user.role !== Role.ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Protected Procedure
 * 
 * Requires user authentication. Use this for endpoints that need
 * a logged-in user (e.g., viewing own transactions, budgets).
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Admin Procedure
 * 
 * Requires admin role. Use this for administrative endpoints
 * (e.g., managing all users, system settings).
 */
export const adminProcedure = t.procedure.use(isAdmin);
