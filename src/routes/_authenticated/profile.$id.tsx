import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Heart, MapPin, Languages as LangIcon, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calcMatch, type ProfileLike, type PrefsLike, pairOrdered } from "@/lib/match";
import { calcAge } from "@/lib/constants";
import { MatchBadge } from "@/components/MatchBadge";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  component: ProfileView,
});

interface FullProfile extends ProfileLike {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  region: string | null;
  religion: string | null;
  occupation: string | null;
}

function ProfileView() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<ProfileLike | null>(null);
  const [prefs, setPrefs] = useState<PrefsLike | null>(null);
  const [target, setTarget] = useState<FullProfile | null>(null);
  const [liked, setLiked] = useState(false);
  const [matched, setMatched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [meR, prefR, targetR, likeR, reciprocal] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("preferences").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("profile_likes").select("id").eq("from_user_id", user.id).eq("to_user_id", id).maybeSingle(),
        supabase.from("profile_likes").select("id").eq("from_user_id", id).eq("to_user_id", user.id).maybeSingle(),
      ]);
      setMe(meR.data as ProfileLike);
      setPrefs(prefR.data as unknown as PrefsLike);
      setTarget(targetR.data as FullProfile);
      setLiked(Boolean(likeR.data));
      setMatched(Boolean(likeR.data && reciprocal.data));
    })();
  }, [user, id]);

  if (!target || !me || !prefs || !user) {
    return <div className="px-5 py-12 text-center text-muted-foreground">Loading…</div>;
  }

  const m = calcMatch(me, prefs, target);
  const age = calcAge(target.date_of_birth);

  async function toggleLike() {
    if (!user || !target) return;
    setBusy(true);
    try {
      if (liked) {
        await supabase.from("profile_likes").delete().eq("from_user_id", user.id).eq("to_user_id", target.id);
        setLiked(false);
        setMatched(false);
      } else {
        const { error } = await supabase.from("profile_likes").insert({ from_user_id: user.id, to_user_id: target.id });
        if (error) throw error;
        setLiked(true);
        // check reciprocal
        const { data: rec } = await supabase.from("profile_likes").select("id").eq("from_user_id", target.id).eq("to_user_id", user.id).maybeSingle();
        if (rec) {
          setMatched(true);
          toast.success(`It's a match! 🎉 You and ${target.display_name} liked each other.`);
        } else {
          toast.success("Interest sent!");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function startChat() {
    if (!user || !target) return;
    const [a, b] = pairOrdered(user.id, target.id);
    // try insert (idempotent via unique)
    const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
      if (error) {
        toast.error(error.message);
        return;
      }
      convId = created.id;
    }
    navigate({ to: "/messages/$id", params: { id: convId! } });
  }

  return (
    <div>
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Browse
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-card shadow-card">
          {target.avatar_url ? (
            <img src={target.avatar_url} alt={target.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-sunset flex items-center justify-center">
              <Heart className="h-20 w-20 text-white/60" />
            </div>
          )}
          <div className="absolute top-3 right-3"><MatchBadge score={m.score} size="lg" /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white">
            <h1 className="font-display text-3xl font-bold">{target.display_name}{age ? `, ${age}` : ""}</h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
              <MapPin className="h-4 w-4" /> {target.town ?? "—"}, {target.region ?? "Namibia"}
            </div>
          </div>
        </div>

        {target.bio && (
          <Section title="About">
            <p className="text-sm leading-relaxed">{target.bio}</p>
          </Section>
        )}

        <Section title="Compatibility">
          <div className="space-y-2 text-sm">
            {m.sharedLanguages.length > 0 && (
              <div className="flex items-start gap-2">
                <LangIcon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>You both speak <b>{m.sharedLanguages.join(", ")}</b></span>
              </div>
            )}
            {m.sharedHobbies.length > 0 && (
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Shared interests: <b>{m.sharedHobbies.join(", ")}</b></span>
              </div>
            )}
            {target.region === me.region && me.region && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Both in <b>{target.region}</b></span>
              </div>
            )}
          </div>
        </Section>

        {(target.tribe || target.languages?.length || target.hobbies?.length) ? (
          <Section title="Profile">
            <Detail label="Cultural background" value={target.tribe} />
            <Detail label="Languages" value={target.languages?.join(", ")} />
            <Detail label="Hobbies" value={target.hobbies?.join(", ")} />
            <Detail label="Religion" value={target.religion} />
            <Detail label="Occupation" value={target.occupation} />
            <Detail label="Looking for" value={target.relationship_goal} />
          </Section>
        ) : null}

        <div className="mt-6 mb-8 grid grid-cols-2 gap-3">
          <button
            onClick={toggleLike}
            disabled={busy}
            className={`rounded-full py-3 font-semibold text-sm border transition shadow-soft ${
              liked
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary"
            }`}
          >
            <Heart className={`inline h-4 w-4 mr-1.5 ${liked ? "fill-current" : ""}`} />
            {liked ? "Liked" : "Like"}
          </button>
          <button
            onClick={startChat}
            disabled={!matched && !liked}
            className="rounded-full py-3 font-semibold text-sm bg-foreground text-background shadow-soft disabled:opacity-50"
          >
            <MessageCircle className="inline h-4 w-4 mr-1.5" />
            {matched ? "Message" : "Send message"}
          </button>
        </div>
        {!matched && (
          <p className="text-center text-xs text-muted-foreground mb-8">
            Like each other to unlock a guaranteed reply, or send a message to start things off.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-3xl bg-card p-5 shadow-card border border-border/50">
      <h2 className="font-display text-lg font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
