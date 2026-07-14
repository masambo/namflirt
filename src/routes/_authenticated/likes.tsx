import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  BadgeCheck,
  Heart,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { calcAge } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/likes")({ component: Likes });

type Tab = "matches" | "received" | "sent";

const tabs: Array<{ value: Tab; label: string; Icon: typeof Heart }> = [
  { value: "matches", label: "Matches", Icon: HeartHandshake },
  { value: "received", label: "Liked you", Icon: Heart },
  { value: "sent", label: "Sent likes", Icon: Send },
];

function Likes() {
  const [tab, setTab] = useState<Tab>("matches");
  const summary = useQuery(api.likes.summary, {}) as Record<Tab, Profile[]> | undefined;
  const profiles = summary?.[tab] ?? [];
  const total = summary
    ? summary.matches.length + summary.received.length + summary.sent.length
    : 0;

  return (
    <main className="connections-page app-page page-width max-w-7xl">
      <header className="flex items-center justify-between py-5 md:py-7">
        <div className="lg:hidden">
          <Brand to="/browse" />
        </div>
        <span className="ml-auto text-xs font-semibold text-white/30">
          {total} {total === 1 ? "connection" : "connections"}
        </span>
      </header>

      <section className="border-b border-white/8 pb-7 md:flex md:items-end md:justify-between md:gap-10 md:pb-9">
        <div>
          <p className="eyebrow">Your connections</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-.065em] md:text-7xl">
            Likes & matches
          </h1>
        </div>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/40 md:mt-0 md:text-right">
          See where the feeling is mutual, who noticed you, and the profiles you want to remember.
        </p>
      </section>

      <section className="grid grid-cols-3 border-b border-white/8" aria-label="Connection totals">
        <ConnectionTotal label="Mutual" value={summary?.matches.length} />
        <ConnectionTotal label="Liked you" value={summary?.received.length} />
        <ConnectionTotal label="You liked" value={summary?.sent.length} />
      </section>

      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-white/8" role="tablist">
        {tabs.map(({ value, label, Icon }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={`relative inline-flex min-h-12 shrink-0 items-center gap-2 px-4 text-xs font-bold transition sm:px-5 ${
                active ? "text-white" : "text-white/38 hover:text-white/75"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              {label}
              <span className="text-[10px] text-white/28">{summary?.[value].length ?? 0}</span>
              {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" /> : null}
            </button>
          );
        })}
      </div>

      {!summary ? (
        <ConnectionsSkeleton />
      ) : profiles.length ? (
        <div className={`mt-6 grid gap-4 pb-16 ${profiles.length > 1 ? "xl:grid-cols-2" : ""}`}>
          {profiles.map((profile) => (
            <ConnectionCard
              key={profile._id}
              profile={profile}
              tab={tab}
              featured={profiles.length === 1}
            />
          ))}
        </div>
      ) : (
        <Empty tab={tab} />
      )}
    </main>
  );
}

function ConnectionTotal({ label, value }: { label: string; value?: number }) {
  return (
    <div className="border-r border-white/8 py-5 last:border-r-0 sm:py-6">
      <p className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{value ?? "-"}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/28 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function ConnectionCard({
  profile,
  tab,
  featured,
}: {
  profile: Profile;
  tab: Tab;
  featured: boolean;
}) {
  const state = connectionState(tab);
  return (
    <article
      className={`group grid min-w-0 overflow-hidden rounded-lg border border-white/9 bg-[#181816] transition hover:border-white/18 ${
        featured
          ? "sm:grid-cols-[minmax(220px,.72fr)_minmax(0,1fr)] lg:min-h-[390px] lg:grid-cols-[minmax(280px,.68fr)_minmax(0,1fr)]"
          : "sm:min-h-[300px] sm:grid-cols-[190px_minmax(0,1fr)]"
      }`}
    >
      <Link
        to="/profile/$id"
        params={{ id: profile._id }}
        className="relative min-h-[320px] overflow-hidden bg-white/5 sm:min-h-full"
        aria-label={`View ${profile.displayName}'s profile`}
      >
        {profile.photos[0] ? (
          <img
            src={profile.photos[0]}
            alt={profile.displayName}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl font-black text-primary">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#141412]/88 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-lg">
          <state.Icon className="h-3 w-3 text-primary" /> {state.badge}
        </span>
      </Link>

      <div className="flex min-w-0 flex-col p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-3xl font-semibold tracking-[-.055em]">
                {profile.displayName}, {calcAge(profile.dateOfBirth)}
              </h2>
              {profile.verified ? (
                <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-[#181816]" />
              ) : null}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-white/38">
              <MapPin className="h-3.5 w-3.5" /> {profile.town ?? profile.region ?? "Namibia"}
            </p>
          </div>
          <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/40 transition group-hover:border-primary/40 group-hover:text-primary sm:grid">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-white/48">
          {profile.bio || state.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {profile.languages.slice(0, 2).map((language) => (
            <span key={language} className="profile-chip">
              {language}
            </span>
          ))}
          {profile.hobbies.slice(0, featured ? 2 : 1).map((hobby) => (
            <span key={hobby} className="profile-chip">
              {hobby}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-7">
          <p className="mb-3 text-[10px] font-semibold text-white/28">{state.description}</p>
          <Link
            to="/profile/$id"
            params={{ id: profile._id }}
            className={
              tab === "matches"
                ? "button-primary w-full justify-center"
                : "button-ghost w-full justify-center"
            }
          >
            {tab === "matches" ? (
              <MessageCircle className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {state.action}
          </Link>
        </div>
      </div>
    </article>
  );
}

function connectionState(tab: Tab) {
  if (tab === "matches") {
    return {
      Icon: Sparkles,
      badge: "It's mutual",
      description: "You liked each other. The conversation is open when you are ready.",
      action: "Open match",
    };
  }
  if (tab === "received") {
    return {
      Icon: Heart,
      badge: "Liked you",
      description: "They noticed your profile. See if the feeling is mutual.",
      action: "View profile",
    };
  }
  return {
    Icon: Send,
    badge: "You liked",
    description: "You saved this profile to come back to later.",
    action: "View profile",
  };
}

function ConnectionsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-[320px] animate-pulse overflow-hidden rounded-lg border border-white/8 bg-white/[.025] sm:grid-cols-[190px_1fr]"
        >
          <div className="bg-white/[.045]" />
          <div className="space-y-4 p-6">
            <div className="h-8 w-2/3 rounded bg-white/5" />
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="mt-8 h-16 rounded bg-white/[.035]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const copy =
    tab === "matches"
      ? "When the feeling is mutual, your matches will appear here."
      : tab === "received"
        ? "No new likes yet. A complete, honest profile makes all the difference."
        : "You haven't sent any likes yet. Explore people who feel like your kind of energy.";
  return (
    <div className="mt-6 border-y border-white/8 px-6 py-24 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10">
        <Heart className="h-5 w-5 text-primary" />
      </span>
      <h2 className="mt-6 text-3xl font-semibold tracking-[-.05em]">A little quiet here.</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">{copy}</p>
      <Link to="/browse" className="button-primary mt-7">
        Discover people
      </Link>
    </div>
  );
}
