import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: ConversationView,
});

interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface OtherProfile { id: string; display_name: string | null; avatar_url: string | null }

function ConversationView() {
  const { id: convId } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const [{ data: conv }, { data: msgs }] = await Promise.all([
        supabase.from("conversations").select("*").eq("id", convId).single(),
        supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true }),
      ]);
      if (conv) {
        const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
        const { data: o } = await supabase.from("profiles").select("id, display_name, avatar_url").eq("id", otherId).single();
        setOther(o as OtherProfile);
      }
      setMessages((msgs ?? []) as Msg[]);

      channel = supabase
        .channel(`conv-${convId}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Msg]);
          })
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [convId, user]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const body = text.trim().slice(0, 1000);
    setBusy(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        body,
      });
      if (error) throw error;
      await supabase.from("conversations")
        .update({ last_message: body, last_message_at: new Date().toISOString() })
        .eq("id", convId);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] md:h-[calc(100vh-2rem)] md:rounded-[2rem] md:border md:hairline md:bg-card md:my-4 md:overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b hairline bg-card/90 backdrop-blur sticky top-0 z-10">
        <Link to="/messages" className="md:hidden text-muted-foreground rounded-full border hairline p-2 hover:text-foreground transition"><ChevronLeft className="h-4 w-4" /></Link>
        {other && (
          <Link to="/profile/$id" params={{ id: other.id }} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden ring-1 ring-[oklch(1_0_0/0.08)]">
              {other.avatar_url ? <img src={other.avatar_url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <div className="font-display text-lg leading-none">{other.display_name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">View profile</div>
            </div>
          </Link>
        )}
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-2xl italic">Say hi 👋</p>
            <p className="mt-2 text-sm text-muted-foreground">First impressions matter — be yourself.</p>
          </div>
        ) : messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
                mine ? "bg-primary text-primary-foreground rounded-br-md shadow-glow" : "bg-card border hairline rounded-bl-md"
              }`}>
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t hairline p-3 flex gap-2 bg-card/80 backdrop-blur">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Write a message…"
          className="flex-1 rounded-full border border-input bg-background/60 px-5 py-3 text-sm outline-none focus:border-primary transition placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50 shadow-glow"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
