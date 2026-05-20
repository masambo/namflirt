import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Pencil, Heart, MapPin, Languages as LangIcon, Sparkles, Briefcase, GraduationCap, Church, Camera, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calcAge } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/me")({
  component: Me,
});

interface MyProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  photos: string[] | null;
  date_of_birth: string | null;
  town: string | null;
  region: string | null;
  tribe: string | null;
  languages: string[] | null;
  hobbies: string[] | null;
  relationship_goal: string | null;
  occupation: string | null;
  education: string | null;
  religion: string | null;
  verified: boolean | null;
}

function Me() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data as MyProfile));
  }, [user]);

  if (!profile) return <div className="px-5 py-12 text-center text-muted-foreground">Loading…</div>;
  const age = calcAge(profile.date_of_birth);
  const photos = (profile.photos && profile.photos.length > 0)
    ? profile.photos
    : profile.avatar_url ? [profile.avatar_url] : [];
  const main = photos[activeIdx] ?? null;
  const needMorePhotos = photos.length < 3;

  return (
    <div className="mx-auto max-w-2xl pb-32">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">Your profile</p>
          <h1 className="mt-0.5 font-display text-3xl font-medium leading-none">Hi, {profile.display_name?.split(" ")[0] ?? "you"} 👋</h1>
        </div>
        <button onClick={() => navigate({ to: "/onboarding" })} className="rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition shadow-glow">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </header>

      <div className="px-4">
        {/* Hero photo */}
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-card shadow-card border hairline">
          {main ? (
            <img key={main} src={main} alt="" className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-300" />
          ) : (
            <div className="absolute inset-0 bg-ember grid place-items-center">
              <Heart className="h-14 w-14 text-primary/40" />
            </div>
          )}

          {/* photo dots */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-0 right-0 px-3 flex gap-1">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i === activeIdx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          )}

          {/* tap zones */}
          <button aria-label="Previous" onClick={() => setActiveIdx((i) => (i - 1 + photos.length) % Math.max(1, photos.length))} className="absolute inset-y-0 left-0 w-1/3" />
          <button aria-label="Next" onClick={() => setActiveIdx((i) => (i + 1) % Math.max(1, photos.length))} className="absolute inset-y-0 right-0 w-1/3" />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 text-white">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-4xl font-medium leading-none">
                {profile.display_name}{age ? <span className="text-white/70 font-light italic"> · {age}</span> : null}
              </h2>
              {profile.verified && <BadgeCheck className="h-5 w-5 text-primary fill-white" />}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/80">
              <MapPin className="h-3.5 w-3.5" /> {profile.town}, {profile.region}
            </div>
          </div>
        </div>

        {/* Photo strip */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative shrink-0 h-16 w-16 rounded-2xl overflow-hidden border-2 transition ${i === activeIdx ? "border-primary" : "border-transparent opacity-70"}`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            className={`shrink-0 h-16 w-16 rounded-2xl border-2 border-dashed grid place-items-center transition ${needMorePhotos ? "border-primary/60 text-primary animate-pulse" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        {needMorePhotos && (
          <div className="mt-3 rounded-2xl bg-primary/10 border border-primary/30 px-4 py-3 text-sm text-primary flex items-start gap-3">
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Add {3 - photos.length} more photo{3 - photos.length === 1 ? "" : "s"}</p>
              <p className="text-xs opacity-80 mt-0.5">Profiles with 3+ photos get up to 3× more matches.</p>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={<Camera className="h-3.5 w-3.5" />} label="Photos" value={String(photos.length)} />
          <Stat icon={<LangIcon className="h-3.5 w-3.5" />} label="Languages" value={String(profile.languages?.length ?? 0)} />
          <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="Interests" value={String(profile.hobbies?.length ?? 0)} />
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-4 rounded-[2rem] bg-card p-6 shadow-card border hairline">
            <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-2">About me</p>
            <p className="font-display text-lg leading-snug italic text-foreground/90">"{profile.bio}"</p>
          </div>
        )}

        {/* Hobbies as chips */}
        {profile.hobbies?.length ? (
          <div className="mt-4 rounded-[2rem] bg-card p-6 shadow-card border hairline">
            <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((h) => (
                <span key={h} className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium">{h}</span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Details grid */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {profile.tribe && <InfoCard icon={<Heart className="h-4 w-4" />} label="Culture" value={profile.tribe} />}
          {profile.languages?.length ? <InfoCard icon={<LangIcon className="h-4 w-4" />} label="Speaks" value={profile.languages.join(" · ")} /> : null}
          {profile.occupation && <InfoCard icon={<Briefcase className="h-4 w-4" />} label="Work" value={profile.occupation} />}
          {profile.education && <InfoCard icon={<GraduationCap className="h-4 w-4" />} label="Education" value={profile.education} />}
          {profile.religion && <InfoCard icon={<Church className="h-4 w-4" />} label="Religion" value={profile.religion} />}
          {profile.relationship_goal && <InfoCard icon={<Sparkles className="h-4 w-4" />} label="Looking for" value={profile.relationship_goal} />}
        </div>

        <button
          onClick={async () => { await signOut(); toast.success("Signed out"); navigate({ to: "/" }); }}
          className="mt-6 w-full rounded-full border hairline bg-card/50 py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-card transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border hairline p-3 text-center">
      <div className="text-muted-foreground inline-flex items-center gap-1 text-[10px] uppercase tracking-wider">{icon}{label}</div>
      <div className="mt-1 font-display text-2xl font-medium">{value}</div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border hairline p-4">
      <div className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider">{icon}{label}</div>
      <div className="mt-1 text-sm font-medium leading-snug">{value}</div>
    </div>
  );
}
