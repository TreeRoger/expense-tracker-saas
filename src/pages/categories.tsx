import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { trpc } from "../utils/trpc";

const colorOptions = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
];

const iconOptions = [
  "", "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "", "",
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
  onSubmit: (data: { id?: string; name: string; color: string; icon?: string }) => void;
  isLoading: boolean;
}

function CategoryModal({ isOpen, onClose, category, onSubmit, isLoading }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || colorOptions[0]);
  const [icon, setIcon] = useState(category?.icon || iconOptions[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setIcon(category.icon || iconOptions[0]);
    } else {
      setName("");
      setColor(colorOptions[Math.floor(Math.random() * colorOptions.length)]);
      setIcon(iconOptions[0]);
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: category?.id, name, color, icon });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{category ? "Edit Category" : "New Category"}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="input-group">
              <label className="input-label">Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Icon</label>
              <div
                className="flex gap-2"
                style={{ flexWrap: "wrap", padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}
              >
                {iconOptions.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    style={{
                      width: 40,
                      height: 40,
                      fontSize: "1.25rem",
                      border: icon === i ? "2px solid var(--accent-primary)" : "2px solid transparent",
                      borderRadius: "var(--radius-sm)",
                      background: icon === i ? "var(--bg-tertiary)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Color</label>
              <div
                className="flex gap-2"
                style={{ flexWrap: "wrap", padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}
              >
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      background: c,
                      border: color === c ? "3px solid var(--text-primary)" : "3px solid transparent",
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="input-group">
              <label className="input-label">Preview</label>
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-md)",
                    background: color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div className="font-medium">{name || "Category Name"}</div>
                  <div className="text-sm text-muted">Sample category</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Saving..." : category ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories() {
  const router = useRouter();
  const utils = trpc.useContext();
  const [isClient, setIsClient] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem("userId")) {
      router.push("/login");
    }
  }, [router]);

  const { data: categories, isLoading } = trpc.category.list.useQuery(undefined, {
    enabled: isClient,
  });

  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setModalOpen(false);
    },
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setModalOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
    },
  });

  const handleSubmit = (data: { id?: string; name: string; color: string; icon?: string }) => {
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
          <h1>Categories</h1>
          <p className="text-secondary mt-2">Organize your transactions with custom categories</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
        >
          + Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 100 }} />
          ))}
        </div>
      ) : categories?.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: "60px 24px" }}>
          <p style={{ fontSize: "3rem", marginBottom: 16 }}></p>
          <p>No categories yet</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              setEditingCategory(null);
              setModalOpen(true);
            }}
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {categories?.map((cat) => (
            <div key={cat.id} className="card" style={{ position: "relative" }}>
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--radius-lg)",
                    background: cat.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                  }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{cat.name}</div>
                  <div className="text-sm text-muted">
                    {cat._count.transactions} transaction{cat._count.transactions !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div
                className="flex gap-2 justify-end mt-4"
                style={{ paddingTop: 12, borderTop: "1px solid var(--border-color)" }}
              >
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditingCategory({
                      id: cat.id,
                      name: cat.name,
                      color: cat.color,
                      icon: cat.icon,
                    });
                    setModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (cat._count.transactions > 0) {
                      alert("Cannot delete category with existing transactions.");
                      return;
                    }
                    if (confirm(`Delete "${cat.name}"?`)) {
                      deleteMutation.mutate({ id: cat.id });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: cat.color,
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }}
              />
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSubmit={handleSubmit}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
      />
    </Layout>
  );
}

