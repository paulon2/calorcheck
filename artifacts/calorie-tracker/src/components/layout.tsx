import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, ChefHat, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "Hoje", icon: LayoutDashboard },
  { href: "/history", label: "Semana", icon: History },
  { href: "/recipes", label: "Receitas", icon: ChefHat },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

function UserAvatar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity shrink-0">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive cursor-pointer gap-2"
          onClick={logout}
        >
          <LogOut size={14} />
          Sair da conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <span className="text-base font-bold text-primary">CalorCheck</span>
        <UserAvatar />
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 py-2 flex justify-around z-50">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <button
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  size={21}
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
