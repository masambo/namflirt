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
    <div className="mx-auto max-w-2xl pb-32">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link to="/browse" className="inline-flex items-center gap-2 rounded-full border hairline bg-card/60 backdrop-blur px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
      </header>

      <div className="px-4">
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-card shadow-card border hairline">
          {target.avatar_url ? (
            <img src={target.avatar_url} alt={target.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-ember grid place-items-center">
              <Heart className="h-20 w-20 text-primary/40" />
            </div>
          )}
          <div className="absolute top-4 right-4"><MatchBadge score={m.score} size="lg" /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white">
            <h1 className="font-display text-5xl font-medium leading-[1]">
              {target.display_name}
              {age ? <span className="font-light italic text-white/75"> · {age}</span> : null}
            </h1>
            <div className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/80">
              <MapPin className="h-3.5 w-3.5" /> {target.town ?? "—"}, {target.region ?? "Namibia"}
            </div>
          </div>
        </div>

        {target.bio && (
          <Section title="About">
            <p className="font-display text-lg leading-snug italic text-foreground/90">"{target.bio}"</p>
          </Section>
        )}

        <Section title="Why you match">
          <div className="space-y-3 text-sm">
            {m.sharedLanguages.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 grid place-items-center text-primary"><LangIcon className="h-4 w-4" /></div>
                <span className="pt-1.5">You both speak <b>{m.sharedLanguages.join(", ")}</b></span>
              </div>
            )}
            {m.sharedHobbies.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 grid place-items-center text-primary"><Sparkles className="h-4 w-4" /></div>
                <span className="pt-1.5">Shared interests: <b>{m.sharedHobbies.join(", ")}</b></span>
              </div>
            )}
            {target.region === me.region && me.region && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 grid place-items-center text-primary"><MapPin className="h-4 w-4" /></div>
                <span className="pt-1.5">Both in <b>{target.region}</b></span>
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

        <div className="fixed bottom-24 inset-x-0 px-4 z-30 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md grid grid-cols-2 gap-3">
          <button
            onClick={toggleLike}
            disabled={busy}
            className={`rounded-full py-3.5 font-semibold text-sm border transition shadow-card backdrop-blur ${
              liked
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/90 border-border hover:border-primary"
            }`}
          >
            <Heart className={`inline h-4 w-4 mr-1.5 ${liked ? "fill-current" : ""}`} />
            {liked ? "Liked" : "Like"}
          </button>
          <button
            onClick={startChat}
            disabled={!matched && !liked}
            className="rounded-full py-3.5 font-semibold text-sm bg-foreground text-background shadow-card disabled:opacity-50"
          >
            <MessageCircle className="inline h-4 w-4 mr-1.5" />
            {matched ? "Message" : "Send message"}
          </button>
          </div>
        </div>
        {!matched && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Like each other to unlock a guaranteed reply, or send a message to start things off.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-[2rem] bg-card p-6 shadow-card border hairline">
      <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-2.5 text-sm border-b hairline last:border-0">
      <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
