import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Package, Users, BarChart3, Settings, Search } from "lucide-react";

type NavItem = { to: "/" | "/templates" | "/customers" | "/analytics" | "/settings"; label: string; icon: typeof Package; exact?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Orders", icon: Package, exact: true },
  { to: "/templates", label: "Templates", icon: LayoutGrid },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-black text-sm tracking-tight">P</div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-accent-foreground">Pathorize</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin</span>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search…"
            className="w-full h-8 pl-8 pr-2 rounded-md bg-sidebar-accent/40 text-xs text-sidebar-foreground placeholder:text-muted-foreground border border-transparent focus:border-border-strong focus:bg-sidebar-accent outline-none transition"
          />
        </div>
      </div>

      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to || pathname.startsWith("/orders/") : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-2.5 px-2.5 h-8 rounded-md text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[oklch(0.72_0.16_255)] to-[oklch(0.62_0.18_295)]" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs font-medium text-sidebar-accent-foreground truncate">Alex Morgan</span>
            <span className="text-[10px] text-muted-foreground truncate">alex@pathorize.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
