import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Zap, Shield, BarChart3, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site-nav";
import { AnimatedBg } from "@/components/animated-bg";
import { PROJECT_TYPES } from "@/lib/project-types";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBg />
      <SiteNav />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs">
            <span className="grid h-2 w-2 place-items-center"><span className="absolute h-2 w-2 rounded-full bg-primary anim-pulse-glow" /><span className="h-1.5 w-1.5 rounded-full bg-primary" /></span>
            <span className="text-muted-foreground">AI Estimator · Live</span>
          </div>
          <h1 className="mt-6 font-display text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
            Estimate any project in <span className="text-gradient">seconds</span>, not days.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            NPAV Tech's AI engine analyses your scope, computes realistic cost ranges, timelines,
            complexity, risk, and recommends the perfect tech stack — for thesis, IoT, web, mobile,
            and event sites.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow text-base px-7">
                Get free estimate <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-4 py-2">
              How it works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 100% free</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Unlimited estimates</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Filipino-friendly pricing</span>
          </div>
        </div>

        {/* Floating preview card */}
        <div className="relative mx-auto mt-20 max-w-4xl anim-float">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl" />
          <div className="relative glass rounded-3xl p-2 shadow-elevated">
            <div className="rounded-2xl bg-background/60 p-8">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-2">npavtech.app/estimator</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Cost range", value: "₱4,500 – ₱9,000", tint: "from-primary/20 to-primary/5" },
                  { label: "Timeline", value: "3 – 5 weeks", tint: "from-accent/20 to-accent/5" },
                  { label: "Complexity", value: "7 / 10", tint: "from-amber-500/20 to-amber-500/5" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border border-border/40 bg-gradient-to-br ${s.tint} p-5`}>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border/40 bg-background/40 p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">AI explanation</div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Mid-complexity SaaS dashboard with auth, role management, real-time charts and Stripe billing.
                  Stack recommendation: Next.js + Supabase + Stripe. Risk flagged on the analytics pipeline.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Next.js","Supabase","Stripe","Tailwind","Recharts"].map((t) => (
                    <span key={t} className="text-[11px] px-2 py-1 rounded-md bg-secondary/60 border border-border/40">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project types grid */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Built for every kind of builder</h2>
          <p className="mt-3 text-muted-foreground">From thesis defense to a Series-A SaaS launch.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROJECT_TYPES.map((p) => (
            <div key={p.id} className={`group relative glass rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-border/40">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{p.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative mx-auto max-w-7xl px-6 pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">From scope to estimate in 3 steps</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, title: "Describe your project", body: "Pick a type and answer a smart structured form. Cael helps you fill the gaps." },
            { icon: Brain, title: "AI analyses scope", body: "Our engine reasons over scope, complexity, integrations & risk to produce a defensible estimate." },
            { icon: BarChart3, title: "Refine & export", body: "Chat with Cael to refine. Save, compare, and (soon) export PDF reports." },
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-[7rem] font-display font-bold text-primary/5 leading-none">{i+1}</div>
              <s.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section className="relative mx-auto max-w-7xl px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, h: "Instant intelligence", b: "Sub-10s estimations powered by frontier LLMs." },
            { icon: Shield, h: "Enterprise security", b: "Row-level security, role-based access, encrypted at rest." },
            { icon: BarChart3, h: "Investor-grade analytics", b: "Track conversion, usage, project mix in one dashboard." },
          ].map((f) => (
            <div key={f.h} className="glass rounded-2xl p-6 flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{f.h}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.b}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="relative glass rounded-3xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Stop guessing. Start estimating.</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join builders shipping faster with AI-grade project intelligence.</p>
            <Link to="/auth" className="inline-block mt-8">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow px-8">
                Get your first estimate <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-7xl px-6 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} NPAV Tech. All rights reserved.</div>
          <div className="flex gap-4"><a href="mailto:hello@npavtech.com" className="hover:text-foreground">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}
