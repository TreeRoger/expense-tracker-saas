/**
 * Dashboard Page
 * 
 * Main dashboard displaying:
 * - Financial summary (income, expenses, net savings)
 * - Budget overview with progress indicators
 * - Recent transactions
 * - Upcoming recurring expenses
 * - Spending breakdown by category
 * 
 * All data is fetched using tRPC with React Query for automatic caching and refetching.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { trpc } from "../utils/trpc";

/**
 * Format number as USD currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format date as short string (e.g., "Jan 15")
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function Dashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
    }
  }, [router]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: summary, isLoading: summaryLoading } = trpc.transaction.getSummary.useQuery(
    { startDate: startOfMonth, endDate: endOfMonth },
    { enabled: isClient && !!localStorage.getItem("userId") }
  );

  const { data: recentTransactions, isLoading: transactionsLoading } = trpc.transaction.list.useQuery(
    { page: 1, limit: 5 },
    { enabled: isClient && !!localStorage.getItem("userId") }
  );

  const { data: budgetData, isLoading: budgetsLoading } = trpc.budget.list.useQuery(
    { month: now.getMonth() + 1, year: now.getFullYear() },
    { enabled: isClient && !!localStorage.getItem("userId") }
  );

  const { data: upcomingRecurrences } = trpc.recurrence.getUpcoming.useQuery(
    { days: 7 },
    { enabled: isClient && !!localStorage.getItem("userId") }
  );

  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <div className="page-header mb-6">
        <h1>Dashboard</h1>
        <p className="text-secondary mt-2">
          Welcome back! Here&apos;s your financial overview for {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid mb-6">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value positive">
            {summaryLoading ? (
              <div className="skeleton" style={{ height: 40, width: 120 }} />
            ) : (
              formatCurrency(summary?.totalIncome ?? 0)
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value negative">
            {summaryLoading ? (
              <div className="skeleton" style={{ height: 40, width: 120 }} />
            ) : (
              formatCurrency(summary?.totalExpenses ?? 0)
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Net Savings</div>
          <div className={`stat-value ${(summary?.netSavings ?? 0) >= 0 ? "positive" : "negative"}`}>
            {summaryLoading ? (
              <div className="skeleton" style={{ height: 40, width: 120 }} />
            ) : (
              formatCurrency(summary?.netSavings ?? 0)
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Budget Used</div>
          <div className="stat-value">
            {budgetsLoading ? (
              <div className="skeleton" style={{ height: 40, width: 120 }} />
            ) : budgetData?.totalBudgeted ? (
              `${Math.round((budgetData.totalSpent / budgetData.totalBudgeted) * 100)}%`
            ) : (
              "0%"
            )}
          </div>
          {budgetData && budgetData.totalBudgeted > 0 && (
            <div className="progress-bar mt-2" style={{ height: 6 }}>
              <div
                className={`progress-fill ${
                  (budgetData.totalSpent / budgetData.totalBudgeted) > 0.9
                    ? "danger"
                    : (budgetData.totalSpent / budgetData.totalBudgeted) > 0.7
                    ? "warning"
                    : "safe"
                }`}
                style={{
                  width: `${Math.min(100, (budgetData.totalSpent / budgetData.totalBudgeted) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/transactions")}>
              View All →
            </button>
          </div>

          {transactionsLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48 }} />
              ))}
            </div>
          ) : recentTransactions?.transactions.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: "40px 0" }}>
              <p>No transactions yet</p>
              <button className="btn btn-primary mt-4" onClick={() => router.push("/transactions")}>
                Add Transaction
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTransactions?.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="category-dot"
                      style={{
                        width: 10,
                        height: 10,
                        background: tx.category.color,
                      }}
                    />
                    <div>
                      <div className="font-medium">{tx.description || tx.category.name}</div>
                      <div className="text-sm text-muted">{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div
                    className={`font-mono font-medium ${
                      tx.type === "INCOME" ? "text-success" : "text-danger"
                    }`}
                    style={{
                      color: tx.type === "INCOME" ? "var(--accent-success)" : "var(--accent-danger)",
                    }}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Budget Overview</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/budgets")}>
              Manage →
            </button>
          </div>

          {budgetsLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60 }} />
              ))}
            </div>
          ) : budgetData?.budgets.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: "40px 0" }}>
              <p>No budgets set up</p>
              <button className="btn btn-primary mt-4" onClick={() => router.push("/budgets")}>
                Create Budget
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {budgetData?.budgets.slice(0, 4).map((budget) => (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{budget.category.icon}</span>
                      <span className="text-sm">{budget.category.name}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${
                        budget.percentUsed > 90
                          ? "danger"
                          : budget.percentUsed > 70
                          ? "warning"
                          : "safe"
                      }`}
                      style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Recurring */}
      {upcomingRecurrences && upcomingRecurrences.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Upcoming Recurring Expenses</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/recurrences")}>
              View All →
            </button>
          </div>
          <div className="flex gap-4" style={{ overflowX: "auto", paddingBottom: 8 }}>
            {upcomingRecurrences.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="card"
                style={{
                  minWidth: 200,
                  padding: 16,
                  background: "var(--bg-secondary)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{rec.category.icon}</span>
                  <span className="text-sm font-medium">{rec.description || rec.category.name}</span>
                </div>
                <div className="font-mono font-medium" style={{ fontSize: "1.25rem" }}>
                  {formatCurrency(rec.amount)}
                </div>
                <div className="text-sm text-muted mt-1">
                  {rec.daysUntilDue <= 0
                    ? "Due today"
                    : rec.daysUntilDue === 1
                    ? "Due tomorrow"
                    : `Due in ${rec.daysUntilDue} days`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending by Category */}
      {summary && summary.byCategory.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Spending by Category</h3>
          </div>
          <div className="grid-3">
            {summary.byCategory.map((item) => (
              <div
                key={item.category.id}
                className="flex items-center gap-4"
                style={{
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: item.category.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  {item.category.icon}
                </div>
                <div>
                  <div className="text-sm text-muted">{item.category.name}</div>
                  <div className="font-mono font-medium">{formatCurrency(item.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
