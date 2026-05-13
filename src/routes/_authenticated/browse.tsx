import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Filter, X } from "lucide-react";
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
    <div>
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Finding your matches…" : `${ranked.length} people sorted by compatibility`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="rounded-full bg-card border border-border p-2.5 shadow-soft"
          aria-label="Filters"
        >
          <Filter className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto max-w-2xl px-4 grid grid-cols-2 gap-3 pb-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
            ))
          : ranked.length === 0
          ? <p className="col-span-2 text-center text-muted-foreground py-12">No matches yet — try widening your filters.</p>
          : ranked.map(({ p, m }) => (
              <Link
                key={p.id}
                to="/profile/$id"
                params={{ id: p.id }}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-card shadow-card border border-border/50"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.display_name ?? ""} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-sunset flex items-center justify-center">
                    <Heart className="h-12 w-12 text-white/60" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="font-display font-bold text-lg leading-tight">
                        {p.display_name ?? "Anonymous"}{calcAge(p.date_of_birth) ? `, ${calcAge(p.date_of_birth)}` : ""}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/80">
                        <MapPin className="h-3 w-3" />
                        {p.town ?? p.region ?? "Namibia"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <MatchBadge score={m.score} size="sm" />
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowFilters(false)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <FilterSelect label="Region" value={filterRegion} onChange={setFilterRegion} options={REGIONS as unknown as string[]} />
              <FilterSelect label="Language" value={filterLanguage} onChange={setFilterLanguage} options={LANGUAGES as unknown as string[]} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min age</span>
                  <input type="number" value={filterMinAge ?? ""} onChange={(e) => setFilterMinAge(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max age</span>
                  <input type="number" value={filterMaxAge ?? ""} onChange={(e) => setFilterMaxAge(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <button
                onClick={() => { setFilterRegion(""); setFilterLanguage(""); setFilterMinAge(null); setFilterMaxAge(null); }}
                className="w-full rounded-full border border-border py-2.5 text-sm font-medium"
              >
                Clear filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Apply
              </button>
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm">
        <option value="">Any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
