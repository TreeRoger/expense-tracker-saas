import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { TransactionType, Prisma } from "@prisma/client";

export const transactionRouter = router({
  // List transactions with filters and pagination
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        categoryId: z.string().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.TransactionWhereInput = {
        userId: ctx.session.user.id,
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.type && { type: input.type }),
        ...(input.startDate || input.endDate
          ? {
              date: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : {}),
        ...(input.search && {
          description: { contains: input.search, mode: "insensitive" as const },
        }),
      };

      const [transactions, total] = await ctx.prisma.$transaction([
        ctx.prisma.transaction.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: { category: true },
          orderBy: { date: "desc" },
        }),
        ctx.prisma.transaction.count({ where }),
      ]);

      return {
        transactions,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get a single transaction
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { category: true, recurrence: true },
      });

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found",
        });
      }

      return transaction;
    }),

  // Create a transaction with budget update (ACID transaction)
  create: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        amount: z.number().positive(),
        type: z.nativeEnum(TransactionType),
        description: z.string().optional(),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify category belongs to user
      const category = await ctx.prisma.category.findFirst({
        where: { id: input.categoryId, userId: ctx.session.user.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // ACID transaction: create transaction and update budget spent
      return ctx.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId: ctx.session.user.id,
            categoryId: input.categoryId,
            amount: new Prisma.Decimal(input.amount),
            type: input.type,
            description: input.description,
            date: input.date,
          },
          include: { category: true },
        });

        // Update budget spent if this is an expense
        if (input.type === TransactionType.EXPENSE) {
          const month = input.date.getMonth() + 1;
          const year = input.date.getFullYear();

          await tx.budget.updateMany({
            where: {
              userId: ctx.session.user.id,
              categoryId: input.categoryId,
              month,
              year,
            },
            data: {
              spent: { increment: input.amount },
            },
          });
        }

        return transaction;
      });
    }),

  // Update a transaction with budget adjustment (ACID transaction)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        categoryId: z.string().optional(),
        amount: z.number().positive().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        description: z.string().optional(),
        date: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found",
        });
      }

      if (input.categoryId) {
        const category = await ctx.prisma.category.findFirst({
          where: { id: input.categoryId, userId: ctx.session.user.id },
        });
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
      }

      // ACID transaction: update transaction and adjust budgets
      return ctx.prisma.$transaction(async (tx) => {
        const oldMonth = existing.date.getMonth() + 1;
        const oldYear = existing.date.getFullYear();

        // Revert old budget spent if was expense
        if (existing.type === TransactionType.EXPENSE) {
          await tx.budget.updateMany({
            where: {
              userId: ctx.session.user.id,
              categoryId: existing.categoryId,
              month: oldMonth,
              year: oldYear,
            },
            data: {
              spent: { decrement: existing.amount.toNumber() },
            },
          });
        }

        const { id, ...updateData } = input;
        const updated = await tx.transaction.update({
          where: { id },
          data: {
            ...updateData,
            ...(updateData.amount && {
              amount: new Prisma.Decimal(updateData.amount),
            }),
          },
          include: { category: true },
        });

        // Apply new budget spent if expense
        const newType = input.type ?? existing.type;
        if (newType === TransactionType.EXPENSE) {
          const newDate = input.date ?? existing.date;
          const newMonth = newDate.getMonth() + 1;
          const newYear = newDate.getFullYear();
          const newAmount = input.amount ?? existing.amount.toNumber();

          await tx.budget.updateMany({
            where: {
              userId: ctx.session.user.id,
              categoryId: input.categoryId ?? existing.categoryId,
              month: newMonth,
              year: newYear,
            },
            data: {
              spent: { increment: newAmount },
            },
          });
        }

        return updated;
      });
    }),

  // Delete a transaction with budget adjustment (ACID transaction)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found",
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        // Revert budget spent if was expense
        if (transaction.type === TransactionType.EXPENSE) {
          const month = transaction.date.getMonth() + 1;
          const year = transaction.date.getFullYear();

          await tx.budget.updateMany({
            where: {
              userId: ctx.session.user.id,
              categoryId: transaction.categoryId,
              month,
              year,
            },
            data: {
              spent: { decrement: transaction.amount.toNumber() },
            },
          });
        }

        return tx.transaction.delete({
          where: { id: input.id },
        });
      });
    }),

  // Get summary statistics
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [income, expenses, byCategory] = await ctx.prisma.$transaction([
        ctx.prisma.transaction.aggregate({
          where: {
            userId: ctx.session.user.id,
            type: TransactionType.INCOME,
            date: { gte: input.startDate, lte: input.endDate },
          },
          _sum: { amount: true },
        }),
        ctx.prisma.transaction.aggregate({
          where: {
            userId: ctx.session.user.id,
            type: TransactionType.EXPENSE,
            date: { gte: input.startDate, lte: input.endDate },
          },
          _sum: { amount: true },
        }),
        ctx.prisma.transaction.groupBy({
          by: ["categoryId"],
          where: {
            userId: ctx.session.user.id,
            type: TransactionType.EXPENSE,
            date: { gte: input.startDate, lte: input.endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      // Get category details for the grouped results
      const categoryIds = byCategory.map((c) => c.categoryId);
      const categories = await ctx.prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      return {
        totalIncome: income._sum.amount?.toNumber() ?? 0,
        totalExpenses: expenses._sum.amount?.toNumber() ?? 0,
        netSavings:
          (income._sum.amount?.toNumber() ?? 0) -
          (expenses._sum.amount?.toNumber() ?? 0),
        byCategory: byCategory.map((c) => ({
          category: categoryMap.get(c.categoryId)!,
          amount: c._sum.amount?.toNumber() ?? 0,
        })),
      };
    }),
});

