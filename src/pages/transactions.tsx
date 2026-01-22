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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: {
    id: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description: string | null;
    date: Date;
  } | null;
  categories: { id: string; name: string; icon: string | null; color: string }[];
  onSubmit: (data: {
    id?: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    date: Date;
  }) => void;
  isLoading: boolean;
}

function TransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  onSubmit,
  isLoading,
}: TransactionModalProps) {
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction?.type || "EXPENSE");
  const [description, setDescription] = useState(transaction?.description || "");
  const [date, setDate] = useState(
    transaction?.date
      ? new Date(transaction.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.categoryId);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setDescription(transaction.description || "");
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
    } else {
      setCategoryId("");
      setAmount("");
      setType("EXPENSE");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: transaction?.id,
      categoryId,
      amount: parseFloat(amount),
      type,
      description: description || undefined,
      date: new Date(date),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </h3>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn flex-1 ${type === "EXPENSE" ? "btn-danger" : "btn-secondary"}`}
                onClick={() => setType("EXPENSE")}
              >
                Expense
              </button>
              <button
                type="button"
                className={`btn flex-1 ${type === "INCOME" ? "btn-primary" : "btn-secondary"}`}
                style={type === "INCOME" ? { background: "var(--accent-success)" } : {}}
                onClick={() => setType("INCOME")}
              >
                Income
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">Amount</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Category</label>
              <select
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Enter a description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Saving..." : transaction ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const router = useRouter();
  const utils = trpc.useContext();
  const [isClient, setIsClient] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description: string | null;
    date: Date;
  } | null>(null);
  const [filterType, setFilterType] = useState<"INCOME" | "EXPENSE" | "">("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem("userId")) {
      router.push("/login");
    }
  }, [router]);

  const { data: categories } = trpc.category.list.useQuery(undefined, {
    enabled: isClient,
  });

  const { data, isLoading } = trpc.transaction.list.useQuery(
    {
      page,
      limit: 15,
      type: filterType || undefined,
      categoryId: filterCategory || undefined,
    },
    { enabled: isClient }
  );

  const createMutation = trpc.transaction.create.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.transaction.getSummary.invalidate();
      utils.budget.list.invalidate();
      setModalOpen(false);
    },
  });

  const updateMutation = trpc.transaction.update.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.transaction.getSummary.invalidate();
      utils.budget.list.invalidate();
      setModalOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = trpc.transaction.delete.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.transaction.getSummary.invalidate();
      utils.budget.list.invalidate();
    },
  });

  const handleSubmit = (data: {
    id?: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    date: Date;
  }) => {
    if (data.id) {
      updateMutation.mutate(data as Parameters<typeof updateMutation.mutate>[0]);
    } else {
      const { id, ...createData } = data;
      createMutation.mutate(createData);
    }
  };

  if (!isClient) return null;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Transactions</h1>
          <p className="text-secondary mt-2">Manage your income and expenses</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingTransaction(null);
            setModalOpen(true);
          }}
        >
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 items-center">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <select
              className="input"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as "" | "INCOME" | "EXPENSE");
                setPage(1);
              }}
              style={{ minWidth: 140 }}
            >
              <option value="">All Types</option>
              <option value="EXPENSE">Expenses</option>
              <option value="INCOME">Income</option>
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              style={{ minWidth: 180 }}
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          {(filterType || filterCategory) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilterType("");
                setFilterCategory("");
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div className="flex flex-col gap-2" style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56 }} />
            ))}
          </div>
        ) : data?.transactions.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: "60px 24px" }}>
            <p style={{ fontSize: "3rem", marginBottom: 16 }}></p>
            <p>No transactions found</p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                setEditingTransaction(null);
                setModalOpen(true);
              }}
            >
              Add your first transaction
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-muted">{formatDate(tx.date)}</td>
                      <td>{tx.description || "—"}</td>
                      <td>
                        <div className="category-tag">
                          <span
                            className="category-dot"
                            style={{ background: tx.category.color }}
                          />
                          {tx.category.name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${tx.type.toLowerCase()}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className="text-right font-mono"
                        style={{
                          color:
                            tx.type === "INCOME"
                              ? "var(--accent-success)"
                              : "var(--accent-danger)",
                        }}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingTransaction({
                                id: tx.id,
                                categoryId: tx.categoryId,
                                amount: Number(tx.amount),
                                type: tx.type as "INCOME" | "EXPENSE",
                                description: tx.description,
                                date: tx.date,
                              });
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (confirm("Delete this transaction?")) {
                                deleteMutation.mutate({ id: tx.id });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div
                className="flex items-center justify-between"
                style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}
              >
                <span className="text-sm text-muted">
                  Showing {(page - 1) * 15 + 1} to{" "}
                  {Math.min(page * 15, data.pagination.total)} of{" "}
                  {data.pagination.total} transactions
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        categories={categories || []}
        onSubmit={handleSubmit}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
      />
    </Layout>
  );
}

