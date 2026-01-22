import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { trpc } from "../utils/trpc";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Budgets() {
  const router = useRouter();
  const utils = trpc.useContext();
  const [isClient, setIsClient] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [addingBudget, setAddingBudget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem("userId")) {
      router.push("/login");
    }
  }, [router]);

  const { data: budgetData, isLoading } = trpc.budget.list.useQuery(
    { month, year },
    { enabled: isClient }
  );

  const { data: categories } = trpc.category.list.useQuery(undefined, {
    enabled: isClient,
  });

  const createBudgetMutation = trpc.budget.getOrCreate.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
      setAddingBudget(false);
      setSelectedCategory("");
      setBudgetAmount("");
    },
  });

  const updateBudgetMutation = trpc.budget.update.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
    },
  });

  const deleteBudgetMutation = trpc.budget.delete.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
    },
  });

  const copyFromPreviousMutation = trpc.budget.copyFromPreviousMonth.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
    },
  });

  const recalculateMutation = trpc.budget.recalculateSpent.useMutation({
    onSuccess: () => {
      utils.budget.list.invalidate();
    },
  });

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const categoriesWithoutBudget = categories?.filter(
    (cat) => !budgetData?.budgets.some((b) => b.categoryId === cat.id)
  );

  if (!isClient) return null;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Budgets</h1>
          <p className="text-secondary mt-2">Set spending limits for each category</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => copyFromPreviousMutation.mutate({ targetMonth: month, targetYear: year })}
            disabled={copyFromPreviousMutation.isLoading}
          >
            📋 Copy from Previous Month
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setAddingBudget(true)}
          >
            + Add Budget
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card mb-6">
        <div className="flex items-center justify-center gap-6">
          <button className="btn btn-ghost" onClick={handlePreviousMonth}>
            ← Previous
          </button>
          <h2 style={{ minWidth: 200, textAlign: "center" }}>
            {monthNames[month - 1]} {year}
          </h2>
          <button className="btn btn-ghost" onClick={handleNextMonth}>
            Next →
          </button>
        </div>
      </div>

      {/* Summary */}
      {budgetData && budgetData.budgets.length > 0 && (
        <div className="stat-grid mb-6">
          <div className="stat-card">
            <div className="stat-label">Total Budgeted</div>
            <div className="stat-value">{formatCurrency(budgetData.totalBudgeted)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value negative">{formatCurrency(budgetData.totalSpent)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className={`stat-value ${budgetData.remaining >= 0 ? "positive" : "negative"}`}>
              {formatCurrency(budgetData.remaining)}
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Form */}
      {addingBudget && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Add New Budget</h3>
            <button className="btn btn-ghost" onClick={() => setAddingBudget(false)}>
              ✕
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBudgetMutation.mutate({
                categoryId: selectedCategory,
                month,
                year,
                amount: parseFloat(budgetAmount),
              });
            }}
            className="flex gap-4 items-end"
          >
            <div className="input-group flex-1">
              <label className="input-label">Category</label>
              <select
                className="input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categoriesWithoutBudget?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ width: 200 }}>
              <label className="input-label">Budget Amount</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createBudgetMutation.isLoading}
            >
              {createBudgetMutation.isLoading ? "Adding..." : "Add Budget"}
            </button>
          </form>
        </div>
      )}

      {/* Budgets List */}
      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="flex flex-col gap-4" style={{ padding: 24 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80 }} />
            ))}
          </div>
        ) : budgetData?.budgets.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: "60px 24px" }}>
            <p style={{ fontSize: "3rem", marginBottom: 16 }}>🎯</p>
            <p>No budgets set for {monthNames[month - 1]} {year}</p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => setAddingBudget(true)}
            >
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {budgetData?.budgets.map((budget) => (
              <div
                key={budget.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-md)",
                        background: budget.category.color + "20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                      }}
                    >
                      {budget.category.icon}
                    </div>
                    <div>
                      <div className="font-medium">{budget.category.name}</div>
                      <div className="text-sm text-muted">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)} spent
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className="font-mono font-medium"
                        style={{
                          color:
                            budget.remaining >= 0
                              ? "var(--accent-success)"
                              : "var(--accent-danger)",
                        }}
                      >
                        {budget.remaining >= 0 ? "+" : ""}
                        {formatCurrency(budget.remaining)}
                      </div>
                      <div className="text-sm text-muted">remaining</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const newAmount = prompt(
                            `Update budget for ${budget.category.name}:`,
                            budget.amount.toString()
                          );
                          if (newAmount && !isNaN(parseFloat(newAmount))) {
                            updateBudgetMutation.mutate({
                              id: budget.id,
                              amount: parseFloat(newAmount),
                            });
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm(`Delete budget for ${budget.category.name}?`)) {
                            deleteBudgetMutation.mutate({ id: budget.id });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div
                    className={`progress-fill ${
                      budget.percentUsed > 100
                        ? "danger"
                        : budget.percentUsed > 80
                        ? "warning"
                        : "safe"
                    }`}
                    style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-muted">
                    {budget.percentUsed.toFixed(1)}% used
                  </span>
                  {budget.percentUsed > 80 && (
                    <span
                      className="text-sm"
                      style={{
                        color:
                          budget.percentUsed > 100
                            ? "var(--accent-danger)"
                            : "var(--accent-warning)",
                      }}
                    >
                      {budget.percentUsed > 100 ? "Over budget!" : "Almost at limit"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {budgetData && budgetData.budgets.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => recalculateMutation.mutate({ month, year })}
            disabled={recalculateMutation.isLoading}
          >
            Recalculate Spent Amounts
          </button>
        </div>
      )}
    </Layout>
  );
}

