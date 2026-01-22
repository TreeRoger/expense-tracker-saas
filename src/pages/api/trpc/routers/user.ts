/**
 * User Router - handles authentication, registration, and user management.
 * Note: Password hashing is simplified for demo. Use bcrypt in production.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";

// Password hashing - simplified for demo. Use bcrypt in production.
const hashPassword = (password: string) => {
  return Buffer.from(password).toString("base64");
};

// Password verification - simplified for demo. Use bcrypt.compare() in production.
const verifyPassword = (password: string, hash: string) => {
  return Buffer.from(password).toString("base64") === hash;
};

export const userRouter = router({
  // Register new user and create default categories
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          passwordHash: hashPassword(input.password),
          name: input.name,
        },
        select: { id: true, email: true, name: true, role: true },
      });

      // Set up default categories for better onboarding
      await ctx.prisma.category.createMany({
        data: [
          { name: "Food & Dining", color: "#ef4444", icon: "", userId: user.id },
          { name: "Transportation", color: "#f97316", icon: "", userId: user.id },
          { name: "Shopping", color: "#eab308", icon: "", userId: user.id },
          { name: "Entertainment", color: "#22c55e", icon: "", userId: user.id },
          { name: "Bills & Utilities", color: "#3b82f6", icon: "", userId: user.id },
          { name: "Health", color: "#ec4899", icon: "", userId: user.id },
          { name: "Salary", color: "#10b981", icon: "", userId: user.id },
          { name: "Other Income", color: "#6366f1", icon: "", userId: user.id },
        ],
      });

      return user;
    }),

  // Login - validates credentials. In production, return JWT token.
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Get current user profile with stats
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            budgets: true,
            recurrences: true,
          },
        },
      },
    });
    return user;
  }),

  // Update user profile - checks email uniqueness
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check email isn't taken by another user
      if (input.email) {
        const existing = await ctx.prisma.user.findFirst({
          where: {
            email: input.email,
            NOT: { id: ctx.session.user.id },
          },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }
      }

      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: { id: true, email: true, name: true, role: true },
      });
    }),

  // Admin: List all users with pagination
  listAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const [users, total] = await ctx.prisma.$transaction([
        ctx.prisma.user.findMany({
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            _count: {
              select: { transactions: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count(),
      ]);

      return {
        users,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Admin: Update user role
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, name: true, role: true },
      });
    }),
});

