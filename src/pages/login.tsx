import { useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.user.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("userId", data.user.id);
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const registerMutation = trpc.user.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("userId", data.id);
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      registerMutation.mutate({ email, password, name: name || undefined });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const isLoading = loginMutation.isLoading || registerMutation.isLoading;

  return (
    <div
      className="page flex items-center justify-center"
      style={{ minHeight: "100vh", padding: 24 }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              background: "var(--gradient-primary)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            $
          </div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>ExpenseTracker</h1>
          <p className="text-secondary">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="input-group">
              <label className="input-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder={isRegister ? "At least 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 8 : undefined}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(248, 113, 113, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
                borderRadius: "var(--radius-md)",
                color: "var(--accent-danger)",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            style={{ marginTop: 8 }}
          >
            {isLoading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

