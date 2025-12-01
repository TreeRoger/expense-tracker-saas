import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/transactions", label: "Transactions", icon: "💳" },
  { href: "/budgets", label: "Budgets", icon: "🎯" },
  { href: "/recurrences", label: "Recurring", icon: "🔄" },
  { href: "/categories", label: "Categories", icon: "🏷️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <span className="sidebar-logo-text">ExpenseTracker</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${
                router.pathname === item.href ? "active" : ""
              }`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid var(--border-color)" }}>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start" }}
            onClick={() => {
              localStorage.removeItem("userId");
              router.push("/login");
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

