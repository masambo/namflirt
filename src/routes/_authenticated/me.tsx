import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Pencil, Heart, MapPin, Languages as LangIcon } from "lucide-react";
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
  date_of_birth: string | null;
  town: string | null;
  region: string | null;
  tribe: string | null;
  languages: string[] | null;
  hobbies: string[] | null;
  relationship_goal: string | null;
}

function Me() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data as MyProfile));
  }, [user]);

  if (!profile) return <div className="px-5 py-12 text-center text-muted-foreground">Loading…</div>;
  const age = calcAge(profile.date_of_birth);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="px-5 pt-8 pb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">You</p>
          <h1 className="mt-1 font-display text-5xl font-medium leading-none">Profile</h1>
        </div>
        <button onClick={() => navigate({ to: "/onboarding" })} className="rounded-full bg-card border hairline px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-secondary transition">
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </button>
      </header>

      <div className="px-4 pb-32">
        <div className="rounded-[2rem] bg-card shadow-card border hairline overflow-hidden">
          <div className="aspect-[4/5] bg-secondary relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-ember grid place-items-center">
                <Heart className="h-14 w-14 text-primary/40" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 text-white">
              <h2 className="font-display text-4xl font-medium leading-none">
                {profile.display_name}{age ? <span className="text-white/70 font-light italic"> · {age}</span> : null}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/80">
                <MapPin className="h-3.5 w-3.5" /> {profile.town}, {profile.region}
              </div>
            </div>
          </div>
          <div className="p-6">
            {profile.bio && <p className="font-display text-lg leading-snug italic text-foreground/90">"{profile.bio}"</p>}
            <div className="mt-5 grid grid-cols-1 gap-2 text-sm">
              {profile.tribe && <Row label="Cultural background" value={profile.tribe} />}
              {profile.languages?.length ? <Row icon={<LangIcon className="h-3.5 w-3.5" />} label="Languages" value={profile.languages.join(", ")} /> : null}
              {profile.hobbies?.length ? <Row label="Hobbies" value={profile.hobbies.join(", ")} /> : null}
              {profile.relationship_goal && <Row label="Looking for" value={profile.relationship_goal} />}
            </div>
          </div>
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

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b hairline py-2.5 last:border-0">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider">{icon}{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
