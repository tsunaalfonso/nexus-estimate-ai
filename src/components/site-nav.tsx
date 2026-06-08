import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut, LayoutDashboard, Shield, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteNav() {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur-xl bg-background/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-bold tracking-tight">NPAV Tech</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Estimator AI</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }} className="px-3 py-2 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/about" className="px-3 py-2 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>About</Link>
          {user && <Link to="/dashboard" className="px-3 py-2 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>Dashboard</Link>}
          {user && <Link to="/estimator" className="px-3 py-2 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>New Estimate</Link>}
          {isAdmin && <Link to="/admin" className="px-3 py-2 text-muted-foreground hover:text-foreground inline-flex items-center gap-1" activeProps={{ className: "text-foreground" }}><Shield className="h-3.5 w-3.5" />Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav({ to: "/dashboard" })} className="hidden sm:inline-flex">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav({ to: "/auth" })}>Sign in</Button>
              <Button size="sm" onClick={() => nav({ to: "/auth" })} className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-glow">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
