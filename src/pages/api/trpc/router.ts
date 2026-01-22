/**
 * Main tRPC Router
 * 
 * Combines all sub-routers into a single application router.
 * This is the root router that exposes all API endpoints.
 * 
 * Router Structure:
 * - user: Authentication and user management
 * - category: Category CRUD operations
 * - transaction: Transaction management and analytics
 * - budget: Monthly budget tracking
 * - recurrence: Recurring transaction management
 */
import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { categoryRouter } from "./routers/category";
import { transactionRouter } from "./routers/transaction";
import { budgetRouter } from "./routers/budget";
import { recurrenceRouter } from "./routers/recurrence";

/**
 * Application Router
 * 
 * Combines all feature routers into a single router.
 * Access endpoints like: trpc.user.login, trpc.transaction.list, etc.
 */
export const appRouter = router({
  user: userRouter,           // User authentication and management
  category: categoryRouter,    // Category management
  transaction: transactionRouter,  // Transaction CRUD and analytics
  budget: budgetRouter,       // Budget management
  recurrence: recurrenceRouter,    // Recurring transaction management
});

/**
 * AppRouter Type
 * 
 * Exported type for use in frontend tRPC client.
 * Provides full type safety for all API endpoints.
 */
export type AppRouter = typeof appRouter;
