/**
 * tRPC Context - creates context for each request with Prisma client and user session.
 * Note: Using header-based auth for demo. In production, use JWT tokens.
 */
import { prisma } from "../../../server/db";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { User } from "@prisma/client";

// Session interface - user info without sensitive data
export interface Session {
  user: Pick<User, "id" | "email" | "name" | "role">;
}

// Creates context for each request - gets user from headers
export async function createContext(opts: CreateNextContextOptions) {
  // Get user ID from header (in production, would use JWT/cookie)
  const userId = opts.req.headers["x-user-id"] as string | undefined;

  let session: Session | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (user) {
      session = { user };
    }
  }

  return {
    prisma,
    session,
  };
}

// Type export for use in tRPC procedures
export type Context = Awaited<ReturnType<typeof createContext>>;
