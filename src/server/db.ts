/**
 * Prisma Database Client
 * 
 * Singleton pattern for Prisma Client to prevent multiple instances
 * in development (Next.js hot reload can create multiple instances).
 * 
 * In production, a new instance is created per server instance.
 * In development, the same instance is reused across hot reloads.
 */
import { PrismaClient } from "@prisma/client";

// Type assertion for global Prisma instance (for Next.js hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Prisma Client Instance
 * 
 * - Reuses existing instance if available (development hot reload)
 * - Creates new instance with query logging enabled (development)
 * - In production, creates fresh instance per server instance
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Log all database queries (useful for debugging)
  });

// Store in global scope in development to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
