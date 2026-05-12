import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import jsPDF from "jspdf";
import { Sparkles, Loader2, ArrowRight, Brain, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PROJECT_TYPES, type ProjectTypeId } from "@/lib/project-types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estimator")({ component: Estimator });

const schema = z.object({
  title: z.string().trim().min(3, "Min 3 chars").max(120),
  description: z.string().trim().min(20, "Add a bit more detail (≥20 chars)").max(2000),
});

type Component = { name: string; category: string; qty: number; unit_price: number; notes: string };
type Result = {
  cost_min: number; cost_max: number;
  timeline_weeks_min: number; timeline_weeks_max: number;
  complexity_score: number; risk_level: string;
  tech_stack: string[];
  breakdown: { phases: { name: string; cost: number; weeks: number; notes: string }[] };
  components?: Component[];
  explanation: string; model: string;
};

function Estimator() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ProjectTypeId | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number>(3000);
  const [urgency, setUrgency] = useState<number>(5);
  const [features, setFeatures] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function generate() {
    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!type || !user) return;

    setLoading(true);
    try {
      const scope = { budget_hint_php: budget, urgency_1_to_10: urgency, feature_list: features.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) };

      const { data: projectRow, error: pErr } = await supabase.from("projects")
        .insert({ user_id: user.id, title, type, description, scope }).select("id").single();
      if (pErr) throw pErr;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ projectType: type, title, description, scope }),
      });
      if (resp.status === 429) { toast.error("Rate limit reached, please retry shortly."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted in workspace."); return; }
      if (!resp.ok) { toast.error("AI estimation failed."); return; }

      const data: Result = await resp.json();
      const { error: eErr } = await supabase.from("estimations").insert({
        project_id: projectRow.id, user_id: user.id,
        cost_min: data.cost_min, cost_max: data.cost_max,
        timeline_weeks_min: data.timeline_weeks_min, timeline_weeks_max: data.timeline_weeks_max,
        complexity_score: data.complexity_score, risk_level: data.risk_level,
        tech_stack: data.tech_stack, breakdown: data.breakdown,
        explanation: data.explanation, model: data.model,
      });
      if (eErr) throw eErr;

      await supabase.from("usage_events").insert({ user_id: user.id, event: "estimation_generated", metadata: { type } });

      setResult(data);
      setStep(3);
      toast.success("Estimation ready!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate estimation");
    } finally { setLoading(false); }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 flex-1">
            <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-all ${
              step >= i ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground"
            }`}>{step > i ? <Check className="h-4 w-4" /> : i}</div>
            {i < 3 && <div className={`h-px flex-1 ${step > i ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="font-display text-3xl font-bold">What kind of project?</h1>
          <p className="text-muted-foreground mt-1">Pick the closest fit. We'll tailor the estimation accordingly.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECT_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => { setType(p.id); setStep(2); }}
                className={`group relative glass rounded-2xl p-6 text-left hover:-translate-y-1 transition-all ${type === p.id ? "ring-2 ring-primary" : ""}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity`} />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-border/40">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-5 font-semibold">{p.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && type && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="glass rounded-2xl p-7">
            <h1 className="font-display text-2xl font-bold">Describe your project</h1>
            <p className="text-muted-foreground text-sm mt-1">The more detail, the sharper the estimate.</p>
            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="title">Project title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Smart greenhouse monitoring system" />
              </div>
              <div>
                <Label htmlFor="desc">What are you building?</Label>
                <Textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Goals, target users, key flows, integrations…" />
              </div>
              <div>
                <Label htmlFor="features">Key features (comma-separated)</Label>
                <Input id="features" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="auth, real-time charts, push notifications…" />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label>Approx. budget hint: ₱{budget.toLocaleString()}</Label>
                  <Slider value={[budget]} min={500} max={120000} step={500} onValueChange={(v) => setBudget(v[0])} className="mt-3" />
                </div>
                <div>
                  <Label>Urgency: {urgency}/10</Label>
                  <Slider value={[urgency]} min={1} max={10} step={1} onValueChange={(v) => setUrgency(v[0])} className="mt-3" />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <>Generate estimate <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 h-fit">
            <Brain className="h-7 w-7 text-primary" />
            <h3 className="mt-4 font-semibold">How Cael estimates</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Parses scope, integrations, complexity</li>
              <li>• Cross-references global market rates</li>
              <li>• Flags risk areas & tech stack fit</li>
              <li>• Produces a defensible breakdown</li>
            </ul>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Your estimation is ready</h1>
              <p className="text-sm text-muted-foreground">Generated by {result.model}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Cost range" value={`₱${Number(result.cost_min).toLocaleString()} – ₱${Number(result.cost_max).toLocaleString()}`} accent="from-primary/20" />
            <Stat label="Timeline" value={`${result.timeline_weeks_min} – ${result.timeline_weeks_max} weeks`} accent="from-accent/20" />
            <Stat label="Complexity" value={`${result.complexity_score} / 10`} accent="from-amber-500/20" />
            <Stat label="Risk" value={result.risk_level} accent={
              result.risk_level === "Low" ? "from-emerald-500/20" :
              result.risk_level === "Medium" ? "from-amber-500/20" :
              "from-rose-500/20"
            } />
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">AI explanation</div>
            <p className="mt-2 leading-relaxed">{result.explanation}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {result.tech_stack.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-md bg-primary/15 border border-primary/30 text-primary">{t}</span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Phase breakdown</div>
            <div className="space-y-3">
              {result.breakdown.phases.map((ph, i) => (
                <div key={i} className="rounded-xl border border-border/40 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{ph.name}</div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">₱{Number(ph.cost).toLocaleString()} · {ph.weeks} wk</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ph.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {result.components && result.components.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Suggested components & parts</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3 text-right">Qty</th>
                      <th className="py-2 pr-3 text-right">Unit (₱)</th>
                      <th className="py-2 pr-3 text-right">Subtotal (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.components.map((c, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{c.name}</div>
                          {c.notes && <div className="text-xs text-muted-foreground">{c.notes}</div>}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{c.category}</td>
                        <td className="py-2 pr-3 text-right">{c.qty}</td>
                        <td className="py-2 pr-3 text-right">₱{Number(c.unit_price).toLocaleString()}</td>
                        <td className="py-2 pr-3 text-right font-semibold">₱{(Number(c.qty) * Number(c.unit_price)).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5">
                      <td colSpan={4} className="py-2 pr-3 text-right font-semibold">Total</td>
                      <td className="py-2 pr-3 text-right font-bold text-primary">
                        ₱{result.components.reduce((a, c) => a + Number(c.qty) * Number(c.unit_price), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => { setStep(1); setResult(null); setTitle(""); setDescription(""); setFeatures(""); }}>New estimation</Button>
            <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow" onClick={() => downloadPdf({ title, description, type: type!, result })}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${accent} to-transparent`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function downloadPdf({ title, description, type, result }: { title: string; description: string; type: string; result: Result }) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 40;
    let y = 50;

    const peso = (n: number) => "PHP " + Number(n).toLocaleString();
    const line = (h = 14) => { y += h; if (y > 780) { doc.addPage(); y = 50; } };

    doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 80, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text("NPAV Tech — Project Estimation", M, 40);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()}  |  ${result.model ?? "AI"}`, M, 60);

    y = 110;
    doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(title, M, y); line(18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
    doc.text(`Type: ${type}`, M, y); line();
    const descLines = doc.splitTextToSize(description, W - M * 2);
    doc.text(descLines, M, y); y += descLines.length * 12 + 8;

    doc.setDrawColor(220); doc.line(M, y, W - M, y); line(20);

    doc.setTextColor(20); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Summary", M, y); line(16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Cost range: ${peso(result.cost_min)} - ${peso(result.cost_max)}`, M, y); line();
    doc.text(`Timeline: ${result.timeline_weeks_min} - ${result.timeline_weeks_max} weeks`, M, y); line();
    doc.text(`Complexity: ${result.complexity_score}/10   |   Risk: ${result.risk_level}`, M, y); line();
    doc.text(`Tech stack: ${result.tech_stack.join(", ")}`, M, y); line(20);

    doc.setFont("helvetica", "bold"); doc.text("AI Explanation", M, y); line(14);
    doc.setFont("helvetica", "normal");
    const expLines = doc.splitTextToSize(result.explanation, W - M * 2);
    doc.text(expLines, M, y); y += expLines.length * 12 + 14;

    doc.setFont("helvetica", "bold"); doc.text("Phase Breakdown", M, y); line(14);
    doc.setFont("helvetica", "normal");
    result.breakdown.phases.forEach((ph) => {
      doc.setFont("helvetica", "bold"); doc.text(`• ${ph.name}`, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${peso(ph.cost)} · ${ph.weeks} wk`, W - M, y, { align: "right" });
      line(12);
      const n = doc.splitTextToSize(ph.notes, W - M * 2 - 14);
      doc.setTextColor(110); doc.text(n, M + 14, y); y += n.length * 11 + 4; doc.setTextColor(20);
    });

    if (result.components?.length) {
      line(10);
      doc.setFont("helvetica", "bold"); doc.text("Suggested Components & Parts", M, y); line(14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("Item", M, y); doc.text("Qty", 340, y); doc.text("Unit", 400, y); doc.text("Subtotal", W - M, y, { align: "right" }); line(12);
      doc.setFont("helvetica", "normal");
      let total = 0;
      result.components.forEach((c) => {
        const sub = Number(c.qty) * Number(c.unit_price); total += sub;
        if (y > 760) { doc.addPage(); y = 50; }
        doc.text(doc.splitTextToSize(c.name, 280), M, y);
        doc.text(String(c.qty), 340, y);
        doc.text(peso(c.unit_price), 400, y);
        doc.text(peso(sub), W - M, y, { align: "right" });
        line(14);
      });
      doc.setFont("helvetica", "bold");
      doc.text("Total", M, y); doc.text(peso(total), W - M, y, { align: "right" }); line();
    }

    doc.setFontSize(8); doc.setTextColor(140);
    doc.text("Generated by NPAV Tech — ProjectAI Estimator", M, 820);
    doc.save(`${title.replace(/[^a-z0-9]+/gi, "_")}_estimation.pdf`);
  } catch (e) {
    console.error(e);
  }
}
