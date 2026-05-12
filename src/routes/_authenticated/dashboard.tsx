import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderKanban, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TYPE_LABEL } from "@/lib/project-types";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, estimations(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totalEstimations = projects.reduce((acc: number, p: any) => acc + (p.estimations?.length ?? 0), 0);
  const avgCost = projects.length
    ? Math.round(
        projects
          .flatMap((p: any) => p.estimations ?? [])
          .reduce((a: number, e: any) => a + (Number(e.cost_min) + Number(e.cost_max)) / 2, 0) /
          Math.max(1, totalEstimations)
      )
    : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>
        <Link to="/estimator">
          <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4" /> New estimation
          </Button>
        </Link>
      </div>

      {/* stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Projects", value: projects.length, icon: FolderKanban },
          { label: "Estimations", value: totalEstimations, icon: Sparkles },
          { label: "Avg. cost", value: avgCost ? `₱${avgCost.toLocaleString()}` : "—", icon: TrendingUp },
          { label: "Plan", value: profile?.plan?.toUpperCase() ?? "FREE", icon: Clock },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* projects */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold mb-4">Recent projects</h2>
        {projects.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Run your first AI estimation in seconds.</p>
            <Link to="/estimator" className="inline-block mt-6">
              <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow">Create estimation</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any) => {
              const est = p.estimations?.[0];
              return (
                <div key={p.id} className="glass rounded-2xl p-5 hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">{TYPE_LABEL[p.type] ?? p.type}</span>
                    <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-3 font-semibold line-clamp-1">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  {est && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-secondary/40 px-3 py-2">
                        <div className="text-muted-foreground">Cost</div>
                        <div className="font-semibold">₱{Number(est.cost_min).toLocaleString()}–₱{Number(est.cost_max).toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg bg-secondary/40 px-3 py-2">
                        <div className="text-muted-foreground">Timeline</div>
                        <div className="font-semibold">{est.timeline_weeks_min}–{est.timeline_weeks_max} wk</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
