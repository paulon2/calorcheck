import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Hoje", icon: LayoutDashboard },
  { href: "/history", label: "Semana", icon: History },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-2 flex justify-around z-50">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <button
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "scale-110 transition-transform" : "transition-transform"}
                />
                <span className={`text-xs font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
