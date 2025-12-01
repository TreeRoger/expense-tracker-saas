import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const categoryRouter = router({
  // List user's categories
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }),

  // Create a new category
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.category.findUnique({
        where: {
          name_userId: {
            name: input.name,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category with this name already exists",
        });
      }

      return ctx.prisma.category.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Update a category
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      if (input.name && input.name !== category.name) {
        const existing = await ctx.prisma.category.findUnique({
          where: {
            name_userId: {
              name: input.name,
              userId: ctx.session.user.id,
            },
          },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Category with this name already exists",
          });
        }
      }

      const { id, ...updateData } = input;
      return ctx.prisma.category.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a category
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { _count: { select: { transactions: true } } },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      if (category._count.transactions > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete category with existing transactions",
        });
      }

      return ctx.prisma.category.delete({
        where: { id: input.id },
      });
    }),
});

