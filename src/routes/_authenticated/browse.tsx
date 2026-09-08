import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { BadgeCheck, Heart, MapPin, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import { calcAge, LANGUAGES, REGIONS } from "@/lib/constants";
import { calcMatch } from "@/lib/match";
import type { Preferences, Profile } from "@/lib/types";
import { Brand } from "@/components/Brand";
import { DiscoveryScopeField } from "@/components/DiscoveryScopeField";
import { COUNTRIES, countryName, formatLocation } from "@/lib/location";
import { matchesDiscovery, profileCountry, type DiscoveryScope } from "../../../shared/discovery";

export const Route = createFileRoute("/_authenticated/browse")({ component: Browse });

const fallbackPreferences: Preferences = {
  minAge: 20,
  maxAge: 45,
  preferredRegions: [],
  preferredLanguages: [],
  preferredTribes: [],
  tribeImportance: "open_to_all",
  preferredHobbies: [],
  openToLongDistance: true,
};

function Browse() {
  const [discoveryScope, setDiscoveryScope] = useState<DiscoveryScope>();
  const data = useQuery(api.profiles.list, discoveryScope ? { discoveryScope } : {}) as
    { viewer: Profile | null; preferences: Preferences | null; profiles: Profile[] } | undefined;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const scope = discoveryScope ?? data?.preferences?.discoveryScope ?? "local";
  const homeCountry = profileCountry(data?.viewer ?? {});
  const selectedCountry = scope === "local" ? homeCountry : country;

  function changeScope(value: DiscoveryScope) {
    setDiscoveryScope(value);
    setCountry("");
    setRegion("");
  }

  const ranked = useMemo(() => {
    if (!data?.viewer) return [];
    return data.profiles
      .filter(
        (profile) =>
          matchesDiscovery(data.viewer!, data.preferences, profile, scope) &&
          (!selectedCountry || profileCountry(profile) === selectedCountry) &&
          (!region || profile.region === region) &&
          (!language || profile.languages.includes(language)),
      )
      .map((profile) => ({
        profile,
        match: calcMatch(data.viewer!, data.preferences ?? fallbackPreferences, profile),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [data, language, region, scope, selectedCountry]);

  const spotlight = ranked[0];
  return (
    <main className="app-page page-width max-w-7xl">
      <header className="flex items-center justify-between py-6 md:py-8">
        <div className="lg:hidden">
          <Brand to="/browse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/8 px-4 py-2 text-xs text-white/40 sm:inline-flex">
            <span className="status-dot mr-2" />{" "}
            {scope === "international"
              ? "International connections"
              : `Discover ${countryName(homeCountry)}`}
          </span>
          <button
            onClick={() => setFiltersOpen(true)}
            className="icon-button"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Made for you</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-.065em] md:text-7xl">Discover</h1>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-white/40">
          People ranked by what you share — never by who paid to be seen.
        </p>
      </div>

      <div className="mb-7 max-w-lg">
        <DiscoveryScopeField value={scope} onChange={changeScope} />
        {data?.preferences?.preferredGender ? (
          <p className="mt-3 text-xs text-white/45">
            Showing{" "}
            {data.preferences.preferredGender === "female"
              ? "women"
              : data.preferences.preferredGender === "male"
                ? "men"
                : "people matching your gender preference"}
            .{" "}
            <Link to="/edit-profile" className="text-primary underline">
              Edit preferences
            </Link>
          </p>
        ) : null}
      </div>

      {!data ? (
        <BrowseSkeleton />
      ) : ranked.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
          {spotlight ? (
            <SpotlightCard profile={spotlight.profile} score={spotlight.match.score} />
          ) : null}
          <section className="grid grid-cols-2 gap-3 content-start">
            {ranked.slice(1, 5).map(({ profile, match }) => (
              <MiniCard key={profile._id} profile={profile} score={match.score} />
            ))}
          </section>
        </div>
      )}

      {ranked.length > 5 ? (
        <section className="mt-16 pb-20">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.05em]">
                More people, more possibilities.
              </h2>
            </div>
            <span className="text-xs text-white/30">{ranked.length - 5} profiles</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ranked.slice(5).map(({ profile, match }) => (
              <MiniCard key={profile._id} profile={profile} score={match.score} />
            ))}
          </div>
        </section>
      ) : null}

      {filtersOpen ? (
        <FilterPanel
          country={country}
          scope={scope}
          showRegions={selectedCountry === "NA"}
          setCountry={(value) => {
            setCountry(value);
            setRegion("");
          }}
          region={region}
          language={language}
          setRegion={setRegion}
          setLanguage={setLanguage}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
    </main>
  );
}

function SpotlightCard({ profile, score }: { profile: Profile; score: number }) {
  return (
    <Link
      to="/profile/$id"
      params={{ id: profile._id }}
      className="group relative min-h-[600px] overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#1b1b18] sm:min-h-[690px]"
    >
      {profile.photos[0] ? (
        <img
          src={profile.photos[0]}
          alt={profile.displayName}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25" />
      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-xs font-semibold backdrop-blur-xl">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Best fit today
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <div className="mb-4 inline-flex rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(255,79,135,.3)]">
          {score}% compatible
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-4xl font-semibold tracking-[-.06em] sm:text-6xl">
            {profile.displayName}, {calcAge(profile.dateOfBirth)}
          </h2>
          {profile.verified ? <BadgeCheck className="h-6 w-6 fill-primary text-black" /> : null}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
          <MapPin className="h-4 w-4" /> {formatLocation(profile)}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.languages.slice(0, 2).map((value) => (
            <span key={value} className="profile-chip">
              {value}
            </span>
          ))}
          {profile.relationshipGoal ? (
            <span className="profile-chip">{profile.relationshipGoal}</span>
          ) : null}
        </div>
      </div>
      <span className="absolute bottom-6 right-6 hidden h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-[0_12px_35px_rgba(255,78,132,.4)] sm:grid">
        <Heart className="h-5 w-5" />
      </span>
    </Link>
  );
}

function MiniCard({ profile, score }: { profile: Profile; score: number }) {
  return (
    <Link
      to="/profile/$id"
      params={{ id: profile._id }}
      className="group relative aspect-[.78] overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#1b1b18]"
    >
      {profile.photos[0] ? (
        <img
          src={profile.photos[0]}
          alt={profile.displayName}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/10" />
      <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold backdrop-blur-lg">
        {score}%
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-xl font-semibold leading-none tracking-[-.045em]">
          {profile.displayName}, {calcAge(profile.dateOfBirth)}
        </h3>
        <p className="mt-1.5 text-[11px] text-white/55">{formatLocation(profile)}</p>
      </div>
    </Link>
  );
}

function FilterPanel({
  country,
  scope,
  showRegions,
  setCountry,
  region,
  language,
  setRegion,
  setLanguage,
  onClose,
}: {
  country: string;
  scope: DiscoveryScope;
  showRegions: boolean;
  setCountry: (value: string) => void;
  region: string;
  language: string;
  setRegion: (value: string) => void;
  setLanguage: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1b1b18] p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Refine your view</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Filters</h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close filters">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-7 space-y-5">
          {scope === "international" ? (
            <label className="block">
              <span className="field-label">Country</span>
              <select
                className="field-input mt-2"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              >
                <option value="">All countries</option>
                {COUNTRIES.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {showRegions ? (
            <Select
              label="Region in Namibia"
              value={region}
              options={REGIONS}
              onChange={setRegion}
            />
          ) : null}
          <Select label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            className="button-ghost justify-center"
            onClick={() => {
              setCountry("");
              setRegion("");
              setLanguage("");
            }}
          >
            Clear
          </button>
          <button className="button-primary justify-center" onClick={onClose}>
            Show matches
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input mt-2"
      >
        <option value="">Everywhere</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function BrowseSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-h-[650px] animate-pulse rounded-[2.4rem] bg-white/5" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-[.78] animate-pulse rounded-[1.65rem] bg-white/5" />
        ))}
      </div>
    </div>
  );
}
function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-white/8 bg-white/[.025] py-24 text-center">
      <Heart className="mx-auto h-6 w-6 text-primary" />
      <h2 className="mt-5 text-3xl font-semibold tracking-[-.05em]">No one here yet.</h2>
      <p className="mt-2 text-sm text-white/40">
        Try International or clear your location and language filters.
      </p>
      <Link to="/edit-profile" className="mt-4 inline-block text-sm text-primary underline">
        Edit who you want to meet
      </Link>
    </div>
  );
}
