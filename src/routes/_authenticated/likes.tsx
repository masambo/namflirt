import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calcAge } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/likes")({
  component: Likes,
});

interface MiniProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  town: string | null;
}

function Likes() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "sent" | "matches">("received");
  const [received, setReceived] = useState<MiniProfile[]>([]);
  const [sent, setSent] = useState<MiniProfile[]>([]);
  const [matches, setMatches] = useState<MiniProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [recvR, sentR] = await Promise.all([
        supabase.from("profile_likes").select("from_user_id").eq("to_user_id", user.id),
        supabase.from("profile_likes").select("to_user_id").eq("from_user_id", user.id),
      ]);
      const recvIds = recvR.data?.map((r) => r.from_user_id) ?? [];
      const sentIds = sentR.data?.map((r) => r.to_user_id) ?? [];
      const matchIds = recvIds.filter((id) => sentIds.includes(id));

      const allIds = Array.from(new Set([...recvIds, ...sentIds]));
      const profilesById = new Map<string, MiniProfile>();
      if (allIds.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, date_of_birth, town")
          .in("id", allIds);
        for (const p of data ?? []) profilesById.set(p.id, p as MiniProfile);
      }
      const map = (ids: string[]) => ids.map((i) => profilesById.get(i)).filter(Boolean) as MiniProfile[];
      setReceived(map(recvIds));
      setSent(map(sentIds));
      setMatches(map(matchIds));
      setLoading(false);
    })();
  }, [user]);

  const list = tab === "received" ? received : tab === "sent" ? sent : matches;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="px-5 pt-8 pb-4">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">Your circle</p>
        <h1 className="mt-1 font-display text-5xl font-medium leading-none">Connections</h1>
      </header>
      <div className="px-5">
        <div className="inline-flex rounded-full bg-card border hairline p-1">
          {(["matches", "received", "sent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                tab === t ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "matches" ? `Matches · ${matches.length}` : t === "received" ? `Likes · ${received.length}` : `Sent · ${sent.length}`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 grid grid-cols-2 gap-3 pb-32">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-3xl bg-card border hairline animate-pulse" />)
        ) : list.length === 0 ? (
          <div className="col-span-2 text-center py-20 px-6">
            <div className="mx-auto h-14 w-14 rounded-full border hairline grid place-items-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-5 font-display text-2xl leading-tight">
              {tab === "received" ? "No likes yet." : tab === "sent" ? "Nothing sent yet." : "No matches yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              {tab === "received" ? "Keep your profile fresh — first impressions matter." : tab === "sent" ? "Discover people you'd love to meet." : "Send some likes to spark a connection."}
            </p>
          </div>
        ) : list.map((p) => (
          <Link key={p.id} to="/profile/$id" params={{ id: p.id }} className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-card shadow-card border hairline">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 bg-ember grid place-items-center"><Heart className="h-8 w-8 text-primary/40" /></div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3.5 pt-10 text-white">
              <div className="font-display text-lg leading-tight">
                {p.display_name}{calcAge(p.date_of_birth) ? <span className="text-white/70">, {calcAge(p.date_of_birth)}</span> : null}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-white/65 mt-0.5">{p.town ?? "Namibia"}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
