import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { calcMatch, type ProfileLike, type PrefsLike } from "@/lib/match";
import { calcAge, REGIONS, LANGUAGES } from "@/lib/constants";
import { MatchBadge } from "@/components/MatchBadge";

export const Route = createFileRoute("/_authenticated/browse")({
  component: Browse,
});

interface ProfileRow extends ProfileLike {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  last_active: string;
}

function Browse() {
  const { user } = useAuth();
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [prefs, setPrefs] = useState<PrefsLike | null>(null);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterLanguage, setFilterLanguage] = useState<string>("");
  const [filterMinAge, setFilterMinAge] = useState<number | null>(null);
  const [filterMaxAge, setFilterMaxAge] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: meData }, { data: prefData }, { data: all }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("preferences").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("*").neq("id", user.id).eq("profile_completed", true).limit(200),
      ]);
      setMe(meData as ProfileRow);
      setPrefs(prefData as unknown as PrefsLike);
      setProfiles((all ?? []) as ProfileRow[]);
      setLoading(false);
    })();
  }, [user]);

  const ranked = useMemo(() => {
    if (!me || !prefs) return [];
    return profiles
      .filter((p) => {
        if (prefs.preferred_gender && p.gender && p.gender !== prefs.preferred_gender) return false;
        if (filterRegion && p.region !== filterRegion) return false;
        if (filterLanguage && !p.languages?.includes(filterLanguage)) return false;
        const age = calcAge(p.date_of_birth);
        if (filterMinAge != null && (age == null || age < filterMinAge)) return false;
        if (filterMaxAge != null && (age == null || age > filterMaxAge)) return false;
        return true;
      })
      .map((p) => ({ p, m: calcMatch(me, prefs, p) }))
      .sort((a, b) => b.m.score - a.m.score);
  }, [me, prefs, profiles, filterRegion, filterLanguage, filterMinAge, filterMaxAge]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="px-5 pt-8 pb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
            {loading ? "Finding matches…" : `${ranked.length} people · sorted by fit`}
          </p>
          <h1 className="mt-1 font-display text-5xl font-medium leading-none">
            Discover
          </h1>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="rounded-full bg-card border hairline p-3 hover:bg-secondary transition shadow-soft"
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </header>

      <div className="px-4 grid grid-cols-2 gap-3 pb-32">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-card animate-pulse border hairline" />
            ))
          : ranked.length === 0
          ? (
              <div className="col-span-2 text-center py-20 px-6">
                <p className="font-display text-2xl">No matches yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try widening your filters to meet more people.</p>
              </div>
            )
          : ranked.map(({ p, m }, idx) => (
              <Link
                key={p.id}
                to="/profile/$id"
                params={{ id: p.id }}
                className={`group relative rounded-3xl overflow-hidden bg-card shadow-card border hairline ${
                  idx % 5 === 0 ? "aspect-[3/4.4] col-span-2" : "aspect-[3/4]"
                }`}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-ember flex items-center justify-center">
                    <Heart className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <MatchBadge score={m.score} size="sm" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3.5 pt-12 text-white">
                  <div className="font-display text-lg leading-tight">
                    {p.display_name ?? "Anonymous"}
                    {calcAge(p.date_of_birth) ? <span className="text-white/70">, {calcAge(p.date_of_birth)}</span> : null}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/65 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {p.town ?? p.region ?? "Namibia"}
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-4" onClick={() => setShowFilters(false)}>
          <div className="w-full max-w-md rounded-[2rem] bg-card border hairline p-7 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">Refine</p>
                <h2 className="font-display text-3xl font-medium leading-none mt-1">Filters</h2>
              </div>
              <button onClick={() => setShowFilters(false)} className="rounded-full border hairline p-2 text-muted-foreground hover:text-foreground transition" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <FilterSelect label="Region" value={filterRegion} onChange={setFilterRegion} options={REGIONS as unknown as string[]} />
              <FilterSelect label="Language" value={filterLanguage} onChange={setFilterLanguage} options={LANGUAGES as unknown as string[]} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min age</span>
                  <input type="number" value={filterMinAge ?? ""} onChange={(e) => setFilterMinAge(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 w-full rounded-2xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:border-primary outline-none" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max age</span>
                  <input type="number" value={filterMaxAge ?? ""} onChange={(e) => setFilterMaxAge(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 w-full rounded-2xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:border-primary outline-none" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { setFilterRegion(""); setFilterLanguage(""); setFilterMinAge(null); setFilterMaxAge(null); }}
                  className="rounded-full border hairline py-3 text-sm font-medium hover:bg-secondary transition"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-input bg-background/50 px-3 py-2.5 text-sm focus:border-primary outline-none">
        <option value="">Any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
