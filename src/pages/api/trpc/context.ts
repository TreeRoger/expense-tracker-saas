import { prisma } from "../../../server/db";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { User } from "@prisma/client";

export interface Session {
  user: Pick<User, "id" | "email" | "name" | "role">;
}

export async function createContext(opts: CreateNextContextOptions) {
  // In production, extract session from JWT/cookie
  // For now, we'll get user from a header (demo purposes)
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

export type Context = Awaited<ReturnType<typeof createContext>>;
