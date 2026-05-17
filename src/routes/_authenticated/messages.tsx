import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesLayout,
});

interface ConvRow {
  id: string;
  user_a: string;
  user_b: string;
  last_message: string | null;
  last_message_at: string | null;
  other?: { id: string; display_name: string | null; avatar_url: string | null };
}

function MessagesLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      const rows = (data ?? []) as ConvRow[];
      const otherIds = Array.from(new Set(rows.map((c) => (c.user_a === user.id ? c.user_b : c.user_a))));
      if (otherIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", otherIds);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        for (const c of rows) {
          const otherId = c.user_a === user.id ? c.user_b : c.user_a;
          c.other = map.get(otherId) as ConvRow["other"];
        }
      }
      setConvs(rows);
      setLoading(false);

      channel = supabase.channel(`conv-list-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
          // simple refresh on any change
          supabase
            .from("conversations")
            .select("*")
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
            .order("last_message_at", { ascending: false, nullsFirst: false })
            .then(({ data: refreshed }) => {
              if (refreshed) {
                setConvs((prev) => {
                  const otherMap = new Map(prev.map((c) => [c.id, c.other]));
                  return (refreshed as ConvRow[]).map((c) => ({ ...c, other: otherMap.get(c.id) }));
                });
              }
            });
        })
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const inDetail = pathname !== "/messages" && pathname.startsWith("/messages/");

  return (
    <div className="md:flex md:gap-4 md:max-w-5xl md:mx-auto">
      <aside className={`md:w-80 md:shrink-0 ${inDetail ? "hidden md:block" : ""}`}>
        <header className="px-5 pt-8 pb-4">
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">Inbox</p>
          <h1 className="mt-1 font-display text-5xl font-medium leading-none">Messages</h1>
        </header>
        <div className="px-3 pb-32">
          {loading ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : convs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="mx-auto h-14 w-14 rounded-full border hairline grid place-items-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-5 font-display text-2xl leading-tight">No chats yet.</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">Like someone you're interested in to start a conversation.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {convs.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/messages/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-card transition border hairline border-transparent hover:border-[oklch(1_0_0/0.08)]"
                  >
                    <Avatar url={c.other?.avatar_url} name={c.other?.display_name} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-lg leading-tight truncate">{c.other?.display_name ?? "User"}</div>
                      <div className="text-sm text-muted-foreground truncate mt-0.5">{c.last_message ?? "Say hi 👋"}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className={`flex-1 ${inDetail ? "" : "hidden md:flex md:items-center md:justify-center md:text-muted-foreground"}`}>
        {inDetail ? <Outlet /> : <p className="hidden md:block font-display italic text-xl">Pick a conversation.</p>}
      </main>
    </div>
  );
}

function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  return (
    <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-[oklch(1_0_0/0.08)]">
      {url ? <img src={url} alt={name ?? ""} className="h-full w-full object-cover" /> : <span className="font-display font-medium text-lg text-primary">{name?.[0] ?? "?"}</span>}
    </div>
  );
}
