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
    <div>
      <header className="px-5 pt-6 pb-3">
        <h1 className="font-display text-3xl font-bold">Connections</h1>
      </header>
      <div className="px-5">
        <div className="inline-flex rounded-full bg-secondary p-1">
          {(["matches", "received", "sent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                tab === t ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t === "matches" ? `Matches (${matches.length})` : t === "received" ? `Likes you (${received.length})` : `You liked (${sent.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-4 grid grid-cols-2 gap-3 pb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />)
        ) : list.length === 0 ? (
          <div className="col-span-2 text-center py-16">
            <Heart className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">
              {tab === "received" ? "No one has liked you yet — keep your profile fresh!" : tab === "sent" ? "You haven't liked anyone yet." : "No mutual matches yet — send some likes!"}
            </p>
          </div>
        ) : list.map((p) => (
          <Link key={p.id} to="/profile/$id" params={{ id: p.id }} className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-card shadow-card border border-border/50">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-sunset" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
              <div className="font-display font-bold leading-tight">
                {p.display_name}{calcAge(p.date_of_birth) ? `, ${calcAge(p.date_of_birth)}` : ""}
              </div>
              <div className="text-xs text-white/80">{p.town ?? "Namibia"}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
