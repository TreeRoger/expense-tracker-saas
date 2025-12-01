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

const frequencyLabels: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurrence?: {
    id: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description: string | null;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
  } | null;
  categories: { id: string; name: string; icon: string | null; color: string }[];
  onSubmit: (data: {
    id?: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    startDate: Date;
    endDate?: Date;
  }) => void;
  isLoading: boolean;
}

function RecurrenceModal({
  isOpen,
  onClose,
  recurrence,
  categories,
  onSubmit,
  isLoading,
}: RecurrenceModalProps) {
  const [categoryId, setCategoryId] = useState(recurrence?.categoryId || "");
  const [amount, setAmount] = useState(recurrence?.amount.toString() || "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(recurrence?.type || "EXPENSE");
  const [description, setDescription] = useState(recurrence?.description || "");
  const [frequency, setFrequency] = useState(recurrence?.frequency || "MONTHLY");
  const [startDate, setStartDate] = useState(
    recurrence?.startDate
      ? new Date(recurrence.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    recurrence?.endDate
      ? new Date(recurrence.endDate).toISOString().split("T")[0]
      : ""
  );

  useEffect(() => {
    if (recurrence) {
      setCategoryId(recurrence.categoryId);
      setAmount(recurrence.amount.toString());
      setType(recurrence.type);
      setDescription(recurrence.description || "");
      setFrequency(recurrence.frequency);
      setStartDate(new Date(recurrence.startDate).toISOString().split("T")[0]);
      setEndDate(
        recurrence.endDate
          ? new Date(recurrence.endDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setCategoryId("");
      setAmount("");
      setType("EXPENSE");
      setDescription("");
      setFrequency("MONTHLY");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
    }
  }, [recurrence, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: recurrence?.id,
      categoryId,
      amount: parseFloat(amount),
      type,
      description: description || undefined,
      frequency: frequency as "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {recurrence ? "Edit Recurring" : "New Recurring Transaction"}
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
              <label className="input-label">Frequency</label>
              <select
                className="input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                required
              >
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">End Date (optional)</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Description (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Netflix subscription"
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
              {isLoading ? "Saving..." : recurrence ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Recurrences() {
  const router = useRouter();
  const utils = trpc.useContext();
  const [isClient, setIsClient] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState<{
    id: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description: string | null;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
  } | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem("userId")) {
      router.push("/login");
    }
  }, [router]);

  const { data: categories } = trpc.category.list.useQuery(undefined, {
    enabled: isClient,
  });

  const { data: recurrences, isLoading } = trpc.recurrence.list.useQuery(
    { isActive: showInactive ? undefined : true },
    { enabled: isClient }
  );

  const createMutation = trpc.recurrence.create.useMutation({
    onSuccess: () => {
      utils.recurrence.list.invalidate();
      utils.recurrence.getUpcoming.invalidate();
      setModalOpen(false);
    },
  });

  const updateMutation = trpc.recurrence.update.useMutation({
    onSuccess: () => {
      utils.recurrence.list.invalidate();
      utils.recurrence.getUpcoming.invalidate();
      setModalOpen(false);
      setEditingRecurrence(null);
    },
  });

  const deleteMutation = trpc.recurrence.delete.useMutation({
    onSuccess: () => {
      utils.recurrence.list.invalidate();
      utils.recurrence.getUpcoming.invalidate();
    },
  });

  const processDueMutation = trpc.recurrence.processDue.useMutation({
    onSuccess: (result) => {
      utils.recurrence.list.invalidate();
      utils.recurrence.getUpcoming.invalidate();
      utils.transaction.list.invalidate();
      utils.budget.list.invalidate();
      alert(`Processed ${result.processed} recurring transactions!`);
    },
  });

  const handleSubmit = (data: {
    id?: string;
    categoryId: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    description?: string;
    frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    startDate: Date;
    endDate?: Date;
  }) => {
    if (data.id) {
      const { id, startDate, ...updateData } = data;
      updateMutation.mutate({ id, ...updateData });
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
          <h1>Recurring Transactions</h1>
          <p className="text-secondary mt-2">Manage your subscriptions and regular payments</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => processDueMutation.mutate()}
            disabled={processDueMutation.isLoading}
          >
            ⚡ Process Due
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingRecurrence(null);
              setModalOpen(true);
            }}
          >
            + Add Recurring
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--accent-primary)" }}
          />
          <span>Show inactive recurrences</span>
        </label>
      </div>

      {/* Recurrences List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : recurrences?.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: "60px 24px" }}>
          <p style={{ fontSize: "3rem", marginBottom: 16 }}>🔄</p>
          <p>No recurring transactions set up</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              setEditingRecurrence(null);
              setModalOpen(true);
            }}
          >
            Add your first recurring transaction
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recurrences?.map((rec) => (
            <div
              key={rec.id}
              className="card"
              style={{
                opacity: rec.isActive ? 1 : 0.6,
                position: "relative",
              }}
            >
              {!rec.isActive && (
                <div
                  className="badge badge-neutral"
                  style={{ position: "absolute", top: 16, right: 16 }}
                >
                  Inactive
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "var(--radius-lg)",
                      background: rec.category.color + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.75rem",
                    }}
                  >
                    {rec.category.icon}
                  </div>
                  <div>
                    <div className="font-medium text-lg">
                      {rec.description || rec.category.name}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`badge badge-${rec.type.toLowerCase()}`}>
                        {rec.type}
                      </span>
                      <span className="badge badge-neutral">
                        {frequencyLabels[rec.frequency]}
                      </span>
                      <span className="text-sm text-muted">
                        Next: {formatDate(rec.nextDueDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div
                      className="font-mono text-xl font-medium"
                      style={{
                        color:
                          rec.type === "INCOME"
                            ? "var(--accent-success)"
                            : "var(--accent-danger)",
                      }}
                    >
                      {rec.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(rec.amount)}
                    </div>
                    <div className="text-sm text-muted">
                      {rec._count.transactions} transactions
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingRecurrence({
                          id: rec.id,
                          categoryId: rec.categoryId,
                          amount: rec.amount,
                          type: rec.type as "INCOME" | "EXPENSE",
                          description: rec.description,
                          frequency: rec.frequency,
                          startDate: rec.startDate,
                          endDate: rec.endDate,
                        });
                        setModalOpen(true);
                      }}
                    >
                      ✏️
                    </button>
                    {rec.isActive && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm("Deactivate this recurring transaction?")) {
                            updateMutation.mutate({ id: rec.id, isActive: false });
                          }
                        }}
                      >
                        ⏸️
                      </button>
                    )}
                    {!rec.isActive && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          updateMutation.mutate({ id: rec.id, isActive: true });
                        }}
                      >
                        ▶️
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (confirm("Delete this recurring transaction?")) {
                          deleteMutation.mutate({ id: rec.id });
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              {rec.endDate && (
                <div
                  className="text-sm text-muted mt-3"
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  Ends on {formatDate(rec.endDate)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RecurrenceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecurrence(null);
        }}
        recurrence={editingRecurrence}
        categories={categories || []}
        onSubmit={handleSubmit}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
      />
    </Layout>
  );
}

