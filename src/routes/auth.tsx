import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedBg } from "@/components/animated-bg";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  fullName: z.string().trim().min(1).max(80).optional(),
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = schema.safeParse({ email, password, fullName: mode === "signup" ? fullName : undefined });
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName || email.split("@")[0] } },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already")) toast.error("That email is already registered. Try signing in.");
          else toast.error(error.message);
          return;
        }
        toast.success("Welcome to NPAV Tech!");
        nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        toast.success("Welcome back!");
        nav({ to: "/dashboard" });
      }
    } finally { setLoading(false); }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error("Google sign-in failed");
  }

  return (
    <div className="relative min-h-screen grid md:grid-cols-2">
      <AnimatedBg />
      {/* Left visual */}
      <div className="hidden md:flex relative items-center justify-center p-12 border-r border-border/40">
        <div className="max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">NPAV Tech</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Estimator AI</div>
            </div>
          </Link>
          <h1 className="font-display text-4xl font-bold leading-tight">
            AI-grade project <span className="text-gradient">intelligence</span> for builders.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Get realistic cost & timeline estimates for any project — backed by structured AI reasoning, not vague guesses.
          </p>
          <div className="mt-10 space-y-4">
            {["3 free estimations to start","Chat with Cael, your AI assistant","Save, compare & track every project"].map((t) => (
              <div key={t} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-primary anim-pulse-glow" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center p-6">
        <div className="w-full max-w-md glass rounded-2xl p-8 shadow-elevated">
          <div className="md:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">NPAV Tech</span>
            </Link>
          </div>
          <h2 className="font-display text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Start with 3 free AI estimations." : "Sign in to your dashboard."}
          </p>

          <Button onClick={google} variant="outline" className="w-full mt-6" type="button">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.3 14.5l-.8 3-2.9.1A10 10 0 012 12c0-1.6.4-3.2 1.1-4.5l2.6.5.8 2.6c-.2.6-.3 1.3-.3 2 0 .7.1 1.4.3 2z"/><path fill="#FBBC05" d="M21.8 9.8a10 10 0 010 4.4l-3.4-.3-.5-2c.2-.6.4-1.2.4-2 0-.7-.2-1.4-.4-2l3.9-.1z"/><path fill="#34A853" d="M21.8 14.2A10 10 0 0112 22a10 10 0 01-9-5.5l3.7-3a6 6 0 0010.5-1l3.6 1.7z"/><path fill="#4285F4" d="M22 12c0 .8-.1 1.5-.2 2.2L12 14v-4h10c0 .7.1 1.3 0 2z"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" /> OR <div className="h-px flex-1 bg-border/60" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow">
              {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-foreground underline-offset-4 hover:underline">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
