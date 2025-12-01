import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { categoryRouter } from "./routers/category";
import { transactionRouter } from "./routers/transaction";
import { budgetRouter } from "./routers/budget";
import { recurrenceRouter } from "./routers/recurrence";

export const appRouter = router({
  user: userRouter,
  category: categoryRouter,
  transaction: transactionRouter,
  budget: budgetRouter,
  recurrence: recurrenceRouter,
});

export type AppRouter = typeof appRouter;
