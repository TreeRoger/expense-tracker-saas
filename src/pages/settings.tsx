import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { trpc } from "../utils/trpc";

export default function Settings() {
  const router = useRouter();
  const utils = trpc.useContext();
  const [isClient, setIsClient] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem("userId")) {
      router.push("/login");
    }
  }, [router]);

  const { data: user, isLoading } = trpc.user.me.useQuery(undefined, {
    enabled: isClient,
    onSuccess: (data) => {
      if (data) {
        setName(data.name || "");
        setEmail(data.email);
      }
    },
  });

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (err) => {
      setMessage(`Error: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: name || undefined,
      email: email !== user?.email ? email : undefined,
    });
  };

  if (!isClient) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h1>Settings</h1>
        <p className="text-secondary mt-2">Manage your account settings</p>
      </div>

      <div className="grid-2">
        {/* Profile Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Profile</h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="skeleton" style={{ height: 48 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {message && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: message.startsWith("Error")
                      ? "rgba(248, 113, 113, 0.1)"
                      : "rgba(52, 211, 153, 0.1)",
                    border: `1px solid ${
                      message.startsWith("Error")
                        ? "rgba(248, 113, 113, 0.2)"
                        : "rgba(52, 211, 153, 0.2)"
                    }`,
                    borderRadius: "var(--radius-md)",
                    color: message.startsWith("Error")
                      ? "var(--accent-danger)"
                      : "var(--accent-success)",
                    fontSize: "0.875rem",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Info</h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="skeleton" style={{ height: 60 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="text-sm text-muted mb-1">Role</div>
                <div className="font-medium flex items-center gap-2">
                  {user?.role === "ADMIN" ? "👑" : "👤"} {user?.role}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="text-sm text-muted mb-1">Member Since</div>
                <div className="font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="text-sm text-muted mb-1">Statistics</div>
                <div className="grid-3 mt-2" style={{ gap: 8 }}>
                  <div>
                    <div className="font-mono text-lg font-medium">
                      {user?._count.transactions ?? 0}
                    </div>
                    <div className="text-sm text-muted">Transactions</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-medium">
                      {user?._count.budgets ?? 0}
                    </div>
                    <div className="text-sm text-muted">Budgets</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-medium">
                      {user?._count.recurrences ?? 0}
                    </div>
                    <div className="text-sm text-muted">Recurring</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--accent-danger)" }}>
              Danger Zone
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Sign Out</div>
              <div className="text-sm text-muted">
                Sign out of your account on this device
              </div>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => {
                localStorage.removeItem("userId");
                router.push("/login");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

