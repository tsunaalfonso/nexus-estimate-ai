import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteNav } from "@/components/site-nav";
import { AnimatedBg } from "@/components/animated-bg";

export const Route = createFileRoute("/_authenticated")({ component: AuthGate });

function AuthGate() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="anim-pulse-glow h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <AnimatedBg />
      <SiteNav />
      <Outlet />
    </div>
  );
}
