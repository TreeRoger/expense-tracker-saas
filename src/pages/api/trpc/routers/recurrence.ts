/**
 * Recurrence Router
 * 
 * Handles recurring transactions (subscriptions, bills, salary, etc.):
 * - Create/update/delete recurring patterns
 * - Process due recurrences (creates transactions automatically)
 * - Calculate next due dates based on frequency
 * - Automatic budget updates when processing expenses
 */
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { RecurrenceFrequency, TransactionType, Prisma } from "@prisma/client";

/**
 * Calculate Next Due Date
 * 
 * Calculates the next due date based on the current date and frequency.
 * Handles all recurrence frequencies (daily, weekly, monthly, etc.).
 */
function calculateNextDueDate(
  currentDate: Date,
  frequency: RecurrenceFrequency
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case RecurrenceFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurrenceFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurrenceFrequency.BIWEEKLY:
      next.setDate(next.getDate() + 14);
      break;
    case RecurrenceFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurrenceFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      break;
    case RecurrenceFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export const recurrenceRouter = router({
  // List all recurrences
  list: protectedProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const recurrences = await ctx.prisma.recurrence.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          category: true,
          _count: { select: { transactions: true } },
        },
        orderBy: { nextDueDate: "asc" },
      });

      return recurrences.map((r) => ({
        ...r,
        amount: r.amount.toNumber(),
      }));
    }),

  // Get a single recurrence with its transactions
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recurrence = await ctx.prisma.recurrence.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          category: true,
          transactions: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });

      if (!recurrence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurrence not found",
        });
      }

      return {
        ...recurrence,
        amount: recurrence.amount.toNumber(),
        transactions: recurrence.transactions.map((t) => ({
          ...t,
          amount: t.amount.toNumber(),
        })),
      };
    }),

  // Create a new recurrence
  create: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        amount: z.number().positive(),
        type: z.nativeEnum(TransactionType),
        description: z.string().optional(),
        frequency: z.nativeEnum(RecurrenceFrequency),
        startDate: z.date(),
        endDate: z.date().optional(),
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

      const recurrence = await ctx.prisma.recurrence.create({
        data: {
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
          amount: new Prisma.Decimal(input.amount),
          type: input.type,
          description: input.description,
          frequency: input.frequency,
          startDate: input.startDate,
          endDate: input.endDate,
          nextDueDate: input.startDate,
        },
        include: { category: true },
      });

      return {
        ...recurrence,
        amount: recurrence.amount.toNumber(),
      };
    }),

  // Update a recurrence
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        categoryId: z.string().optional(),
        amount: z.number().positive().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        description: z.string().optional(),
        frequency: z.nativeEnum(RecurrenceFrequency).optional(),
        endDate: z.date().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const recurrence = await ctx.prisma.recurrence.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!recurrence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurrence not found",
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

      const { id, ...updateData } = input;
      const updated = await ctx.prisma.recurrence.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.amount && {
            amount: new Prisma.Decimal(updateData.amount),
          }),
        },
        include: { category: true },
      });

      return {
        ...updated,
        amount: updated.amount.toNumber(),
      };
    }),

  // Delete a recurrence
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recurrence = await ctx.prisma.recurrence.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!recurrence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurrence not found",
        });
      }

      return ctx.prisma.recurrence.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Process Due Recurrences
   * 
   * Finds all active recurrences that are due and:
   * 1. Creates transaction records for each due recurrence
   * 2. Updates budget.spent if it's an expense
   * 3. Calculates and updates nextDueDate
   * 4. Deactivates recurrences that have reached their endDate
   * 
   * This should be called periodically (e.g., daily cron job) to process
   * recurring transactions automatically.
   */
  processDue: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date();

    // Find all active recurrences that are due
    const dueRecurrences = await ctx.prisma.recurrence.findMany({
      where: {
        userId: ctx.session.user.id,
        isActive: true,
        nextDueDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    const results = await ctx.prisma.$transaction(async (tx) => {
      const created: {
        recurrenceId: string;
        transactionId: string;
        amount: number;
      }[] = [];

      for (const recurrence of dueRecurrences) {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: ctx.session.user.id,
            categoryId: recurrence.categoryId,
            amount: recurrence.amount,
            type: recurrence.type,
            description: recurrence.description,
            date: recurrence.nextDueDate,
            recurrenceId: recurrence.id,
          },
        });

        // Update budget if expense
        if (recurrence.type === TransactionType.EXPENSE) {
          const month = recurrence.nextDueDate.getMonth() + 1;
          const year = recurrence.nextDueDate.getFullYear();

          await tx.budget.updateMany({
            where: {
              userId: ctx.session.user.id,
              categoryId: recurrence.categoryId,
              month,
              year,
            },
            data: {
              spent: { increment: recurrence.amount.toNumber() },
            },
          });
        }

        // Calculate next due date based on frequency
        const nextDueDate = calculateNextDueDate(
          recurrence.nextDueDate,
          recurrence.frequency
        );

        // Check if recurrence should be deactivated (reached end date)
        const shouldDeactivate =
          recurrence.endDate && nextDueDate > recurrence.endDate;

        await tx.recurrence.update({
          where: { id: recurrence.id },
          data: {
            nextDueDate,
            isActive: !shouldDeactivate,
          },
        });

        created.push({
          recurrenceId: recurrence.id,
          transactionId: transaction.id,
          amount: recurrence.amount.toNumber(),
        });
      }

      return created;
    });

    return {
      processed: results.length,
      transactions: results,
    };
  }),

  /**
   * Get Upcoming Recurrences
   * 
   * Returns active recurrences that are due within the specified number of days.
   * Useful for displaying upcoming bills/subscriptions on the dashboard.
   */
  getUpcoming: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.days);

      const upcoming = await ctx.prisma.recurrence.findMany({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
          nextDueDate: { lte: futureDate },
        },
        include: { category: true },
        orderBy: { nextDueDate: "asc" },
      });

      return upcoming.map((r) => ({
        ...r,
        amount: r.amount.toNumber(),
        daysUntilDue: Math.ceil(
          (r.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }));
    }),
});

