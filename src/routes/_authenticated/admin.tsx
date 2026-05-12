import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Sparkles, BarChart3, Activity, Save, MapPin } from "lucide-react";
import { TYPE_LABEL } from "@/lib/project-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const { isAdmin, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, projects, estimations, events] = await Promise.all([
        supabase.from("profiles").select("id, full_name, plan, created_at").order("created_at", { ascending: false }),
        supabase.from("projects").select("id, type, created_at"),
        supabase.from("estimations").select("id, cost_min, cost_max, complexity_score, created_at"),
        supabase.from("usage_events").select("event, created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      return { profiles: profiles.data ?? [], projects: projects.data ?? [], estimations: estimations.data ?? [], events: events.data ?? [] };
    },
  });

  if (loading) return null;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Shield className="h-12 w-12 text-primary mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">Your account doesn't have admin permissions.</p>
      </main>
    );
  }

  const projects = data?.projects ?? [];
  const estimations = data?.estimations ?? [];
  const profiles = data?.profiles ?? [];

  const avgCost = estimations.length
    ? Math.round(estimations.reduce((a, e) => a + (Number(e.cost_min) + Number(e.cost_max)) / 2, 0) / estimations.length)
    : 0;

  const byType = Object.entries(
    projects.reduce((acc: Record<string, number>, p: any) => { acc[p.type] = (acc[p.type] ?? 0) + 1; return acc; }, {})
  ).map(([k, v]) => ({ type: TYPE_LABEL[k] ?? k, count: v }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">Admin</h1>
      </div>
      <p className="text-muted-foreground mt-1">Investor-grade analytics across the platform.</p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total users", value: profiles.length, icon: Users },
          { label: "Total projects", value: projects.length, icon: BarChart3 },
          { label: "Total estimations", value: estimations.length, icon: Sparkles },
          { label: "Avg estimate", value: avgCost ? `₱${avgCost.toLocaleString()}` : "—", icon: Activity },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{isLoading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Projects by category</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byType}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="type" stroke="oklch(0.7 0.025 255)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.025 255)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 265)", border: "1px solid oklch(0.3 0.04 265 / 0.4)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="oklch(0.78 0.18 175)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent activity</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(data?.events ?? []).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                <span>{e.event}</span>
                <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleString()}</span>
              </div>
            ))}
            {(data?.events ?? []).length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
          </div>
        </div>
      </div>

      <div className="mt-8 glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">New users</h3>
          <span className="text-xs text-muted-foreground">{profiles.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 15).map((p: any) => (
                <tr key={p.id} className="border-b border-border/20 last:border-0">
                  <td className="py-2 pr-3 font-medium">{p.full_name ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 capitalize">{p.plan}</span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-sm text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
