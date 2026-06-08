import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, CheckCircle2, XCircle, Hourglass, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/meetings")({ component: MeetingsPage });

const TIMES = Array.from({ length: 22 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const STATUS_STYLES: Record<string, { label: string; cls: string; Icon: any }> = {
  pending: { label: "Pending", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", Icon: Hourglass },
  accepted: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  declined: { label: "Declined", cls: "bg-red-500/15 text-red-300 border-red-500/30", Icon: XCircle },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground border-border", Icon: Ban },
};

function MeetingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("30");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("meetings")
        .select("*")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Please add a meeting title");
      if (!date) throw new Error("Please pick a date");
      const [h, m] = time.split(":").map(Number);
      const when = new Date(date);
      when.setHours(h, m, 0, 0);
      if (when.getTime() < Date.now()) throw new Error("Please choose a future time");
      const { error } = await (supabase as any).from("meetings").insert({
        user_id: user!.id,
        title: title.trim(),
        notes: notes.trim() || null,
        requested_at: when.toISOString(),
        duration_minutes: Number(duration),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting request submitted");
      setTitle(""); setNotes(""); setDate(undefined); setTime("10:00"); setDuration("30");
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["admin-meetings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("meetings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting cancelled");
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">Schedule a meeting</h1>
      </div>
      <p className="text-muted-foreground mt-1">Pick a date and time. We'll review your request and confirm shortly.</p>

      <div className="mt-8 grid lg:grid-cols-[1fr_1.1fr] gap-6">
        {/* Form */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project discovery call" />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What would you like to discuss?" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(d) => d < new Date(new Date().toDateString())}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow"
          >
            {create.isPending ? "Submitting…" : "Request meeting"}
          </Button>
        </div>

        {/* My meetings */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Your meetings</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : meetings.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No meetings yet — request one to get started.</div>
          ) : (
            <ul className="space-y-3">
              {meetings.map((m: any) => {
                const s = STATUS_STYLES[m.status] ?? STATUS_STYLES.pending;
                return (
                  <li key={m.id} className="rounded-xl border border-border/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{m.title}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(m.requested_at), "PPP p")} · {m.duration_minutes} min
                        </div>
                        {m.notes && <p className="mt-2 text-sm text-muted-foreground">{m.notes}</p>}
                        {m.admin_notes && (
                          <p className="mt-2 text-sm rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
                            <span className="text-xs uppercase tracking-wider text-primary">From admin:</span> {m.admin_notes}
                          </p>
                        )}
                      </div>
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border whitespace-nowrap", s.cls)}>
                        <s.Icon className="h-3 w-3" /> {s.label}
                      </span>
                    </div>
                    {m.status === "pending" && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => cancel.mutate(m.id)}>
                        Cancel request
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
