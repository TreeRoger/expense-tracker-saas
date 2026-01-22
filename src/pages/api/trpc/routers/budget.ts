/**
 * Budget Router
 * 
 * Handles monthly budget management:
 * - Create/update/delete budgets per category per month
 * - Automatic spent calculation from transactions
 * - Copy budgets from previous months
 * - Recalculate spent amounts for data integrity
 */
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma, TransactionType } from "@prisma/client";

export const budgetRouter = router({
  /**
   * List Budgets for Month/Year
   * 
   * Retrieves all budgets for a specific month and year.
   * Calculates totals, remaining amounts, and percentage used.
   */
  list: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000).max(2100),
      })
    )
    .query(async ({ ctx, input }) => {
      const budgets = await ctx.prisma.budget.findMany({
        where: {
          userId: ctx.session.user.id,
          month: input.month,
          year: input.year,
        },
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      });

      // Calculate aggregate totals across all budgets for the month
      const totals = budgets.reduce(
        (acc, budget) => ({
          totalBudgeted: acc.totalBudgeted + budget.amount.toNumber(),
          totalSpent: acc.totalSpent + budget.spent.toNumber(),
        }),
        { totalBudgeted: 0, totalSpent: 0 }
      );

      return {
        budgets: budgets.map((b) => ({
          ...b,
          amount: b.amount.toNumber(),
          spent: b.spent.toNumber(),
          remaining: b.amount.toNumber() - b.spent.toNumber(),
          percentUsed:
            b.amount.toNumber() > 0
              ? (b.spent.toNumber() / b.amount.toNumber()) * 100
              : 0,
        })),
        ...totals,
        remaining: totals.totalBudgeted - totals.totalSpent,
      };
    }),

  /**
   * Get or Create Budget
   * 
   * Upserts a budget for a category/month/year combination.
   * Automatically calculates current spent amount from transactions.
   * Useful for creating budgets that reflect actual spending.
   */
  getOrCreate: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        month: z.number().min(1).max(12),
        year: z.number().min(2000).max(2100),
        amount: z.number().nonnegative().default(0),
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

      // Calculate current spent amount from actual transactions for this category/month
      // This ensures budget.spent reflects real spending, not just manual updates
      const startDate = new Date(input.year, input.month - 1, 1);  // First day of month
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);  // Last day of month

      const spentResult = await ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
          type: TransactionType.EXPENSE,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });

      const spent = spentResult._sum.amount?.toNumber() ?? 0;

      // Upsert the budget
      const budget = await ctx.prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId: ctx.session.user.id,
            categoryId: input.categoryId,
            month: input.month,
            year: input.year,
          },
        },
        create: {
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
          month: input.month,
          year: input.year,
          amount: new Prisma.Decimal(input.amount),
          spent: new Prisma.Decimal(spent),
        },
        update: {
          amount: new Prisma.Decimal(input.amount),
          spent: new Prisma.Decimal(spent),
        },
        include: { category: true },
      });

      return {
        ...budget,
        amount: budget.amount.toNumber(),
        spent: budget.spent.toNumber(),
        remaining: budget.amount.toNumber() - budget.spent.toNumber(),
      };
    }),

  // Update budget amount
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const budget = await ctx.prisma.budget.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!budget) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Budget not found",
        });
      }

      const updated = await ctx.prisma.budget.update({
        where: { id: input.id },
        data: { amount: new Prisma.Decimal(input.amount) },
        include: { category: true },
      });

      return {
        ...updated,
        amount: updated.amount.toNumber(),
        spent: updated.spent.toNumber(),
        remaining: updated.amount.toNumber() - updated.spent.toNumber(),
      };
    }),

  // Delete a budget
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const budget = await ctx.prisma.budget.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!budget) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Budget not found",
        });
      }

      return ctx.prisma.budget.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Copy Budgets from Previous Month
   * 
   * Convenience feature to copy all budgets from the previous month
   * to the target month. Useful for setting up monthly budgets quickly.
   * Skips categories that already have budgets in the target month.
   */
  copyFromPreviousMonth: protectedProcedure
    .input(
      z.object({
        targetMonth: z.number().min(1).max(12),
        targetYear: z.number().min(2000).max(2100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate previous month
      let sourceMonth = input.targetMonth - 1;
      let sourceYear = input.targetYear;
      if (sourceMonth === 0) {
        sourceMonth = 12;
        sourceYear -= 1;
      }

      // Get previous month's budgets
      const previousBudgets = await ctx.prisma.budget.findMany({
        where: {
          userId: ctx.session.user.id,
          month: sourceMonth,
          year: sourceYear,
        },
      });

      if (previousBudgets.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No budgets found in previous month to copy",
        });
      }

      // Create budgets for target month (skip if already exists)
      const results = await ctx.prisma.$transaction(
        previousBudgets.map((budget) =>
          ctx.prisma.budget.upsert({
            where: {
              userId_categoryId_month_year: {
                userId: ctx.session.user.id,
                categoryId: budget.categoryId,
                month: input.targetMonth,
                year: input.targetYear,
              },
            },
            create: {
              userId: ctx.session.user.id,
              categoryId: budget.categoryId,
              month: input.targetMonth,
              year: input.targetYear,
              amount: budget.amount,
              spent: new Prisma.Decimal(0),
            },
            update: {}, // Don't update if exists
            include: { category: true },
          })
        )
      );

      return results;
    }),

  /**
   * Recalculate Spent Amounts
   * 
   * Recalculates budget.spent values from actual transactions.
   * Useful for data integrity checks or fixing inconsistencies.
   * 
   * This is a maintenance operation that ensures budgets match reality.
   */
  recalculateSpent: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number().min(2000).max(2100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      // Get all budgets for the month
      const budgets = await ctx.prisma.budget.findMany({
        where: {
          userId: ctx.session.user.id,
          month: input.month,
          year: input.year,
        },
      });

      // Recalculate each budget's spent amount
      const updates = await ctx.prisma.$transaction(
        budgets.map(async (budget) => {
          const spent = await ctx.prisma.transaction.aggregate({
            where: {
              userId: ctx.session.user.id,
              categoryId: budget.categoryId,
              type: TransactionType.EXPENSE,
              date: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          });

          return ctx.prisma.budget.update({
            where: { id: budget.id },
            data: { spent: spent._sum.amount ?? new Prisma.Decimal(0) },
            include: { category: true },
          });
        })
      );

      return updates;
    }),
});

