import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Sparkles, BarChart3, Activity, Save, MapPin, Plus, Trash2, Upload, UserCircle2 } from "lucide-react";
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

      <SiteSettingsEditor />
    </main>
  );
}

function SiteSettingsEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").single();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("site_settings").update({
        about_title: payload.about_title,
        about_subtitle: payload.about_subtitle,
        about_body: payload.about_body,
        mission: payload.mission,
        vision: payload.vision,
        office_name: payload.office_name,
        office_address: payload.office_address,
        office_lat: Number(payload.office_lat),
        office_lng: Number(payload.office_lng),
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone,
        hero_tagline: payload.hero_tagline,
      }).eq("id", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Site settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  if (!form) return <div className="mt-8 glass rounded-2xl p-6 text-sm text-muted-foreground">Loading site settings…</div>;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const lat = Number(form.office_lat);
  const lng = Number(form.office_lng);
  const d = 0.01;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="mt-8 glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">About page & site content</h3>
          <p className="text-xs text-muted-foreground">Edits apply instantly to the public About page.</p>
        </div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow">
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div><Label>Hero tagline (homepage)</Label><Input value={form.hero_tagline} onChange={(e) => set("hero_tagline", e.target.value)} /></div>
          <div><Label>About title</Label><Input value={form.about_title} onChange={(e) => set("about_title", e.target.value)} /></div>
          <div><Label>About subtitle</Label><Input value={form.about_subtitle} onChange={(e) => set("about_subtitle", e.target.value)} /></div>
          <div><Label>About body</Label><Textarea rows={5} value={form.about_body} onChange={(e) => set("about_body", e.target.value)} /></div>
          <div><Label>Mission</Label><Textarea rows={3} value={form.mission} onChange={(e) => set("mission", e.target.value)} /></div>
          <div><Label>Vision</Label><Textarea rows={3} value={form.vision} onChange={(e) => set("vision", e.target.value)} /></div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact email</Label><Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></div>
            <div><Label>Contact phone</Label><Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          </div>
          <div><Label>Office name</Label><Input value={form.office_name} onChange={(e) => set("office_name", e.target.value)} /></div>
          <div><Label>Office address</Label><Input value={form.office_address} onChange={(e) => set("office_address", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Latitude</Label><Input type="number" step="0.0001" value={form.office_lat} onChange={(e) => set("office_lat", e.target.value)} /></div>
            <div><Label>Longitude</Label><Input type="number" step="0.0001" value={form.office_lng} onChange={(e) => set("office_lng", e.target.value)} /></div>
          </div>
          <div className="rounded-xl overflow-hidden border border-border/40">
            <div className="px-3 py-2 bg-secondary/40 text-xs flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> Live map preview</div>
            <iframe title="Map preview" src={mapSrc} className="w-full h-[260px] border-0" loading="lazy" />
          </div>
          <p className="text-xs text-muted-foreground">Tip: find coordinates on openstreetmap.org — right-click any spot and copy lat/lng.</p>
        </div>
      </div>
    </div>
  );
}
