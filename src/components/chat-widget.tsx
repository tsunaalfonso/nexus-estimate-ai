import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **NOVA**, your AI project assistant. Ask me anything about scoping, estimation, or tech stack choices." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, open]);

  async function ensureConversation() {
    if (!user || convId) return convId;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: "Quick chat" })
      .select("id").single();
    if (error) return null;
    setConvId(data.id);
    return data.id;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    let assistantSoFar = "";
    let assistantStarted = false;

    try {
      const cid = await ensureConversation();
      if (cid && user) {
        await supabase.from("chat_messages").insert({ conversation_id: cid, user_id: user.id, role: "user", content: text });
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (resp.status === 429) { toast.error("Rate limit reached, please wait a moment."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits in Workspace settings."); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                if (!assistantStarted) { assistantStarted = true; return [...prev, { role: "assistant", content: assistantSoFar }]; }
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (cid && user && assistantSoFar) {
        await supabase.from("chat_messages").insert({ conversation_id: cid, user_id: user.id, role: "assistant", content: assistantSoFar });
      }
    } catch (e) {
      console.error(e);
      toast.error("Chat failed. Try again.");
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow anim-pulse-glow hover:scale-105 transition-transform"
        aria-label="Chat with NOVA"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-background text-[10px] font-bold border border-primary anim-float"><Sparkles className="h-3 w-3 text-primary" /></span>}
      </button>

      {/* Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] origin-bottom-right transition-all duration-300 ${open ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
      >
        <div className="glass rounded-2xl shadow-elevated overflow-hidden flex flex-col h-[min(70vh,560px)]">
          <div className="flex items-center gap-3 p-4 border-b border-border/40">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background anim-pulse-glow" />
            </div>
            <div>
              <div className="font-semibold leading-none">NOVA</div>
              <div className="text-xs text-muted-foreground mt-1">AI Project Assistant · Online</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary/60 text-foreground rounded-bl-sm border border-border/40"
                }`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 px-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>

          <div className="border-t border-border/40 p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask NOVA anything…"
                className="flex-1 rounded-xl bg-input/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="bg-gradient-to-br from-primary to-accent">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
