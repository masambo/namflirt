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
import { formatLocation } from "@/lib/location";
import type { Profile } from "@/lib/types";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/likes")({ component: Likes });

type Tab = "matches" | "received" | "viewed" | "sent";

const tabs: Array<{ value: Tab; label: string; Icon: typeof Heart }> = [
  { value: "matches", label: "Matches", Icon: HeartHandshake },
  { value: "received", label: "Liked you", Icon: Heart },
  { value: "viewed", label: "Viewed you", Icon: Sparkles },
  { value: "sent", label: "Sent likes", Icon: Send },
];

function Likes() {
  const [tab, setTab] = useState<Tab>("matches");
  const summary = useQuery(api.likes.summary, {}) as
    { matches: Profile[]; received: Profile[]; viewed: Profile[]; sent: Profile[] } | undefined;
  const profiles = summary?.[tab] ?? [];

  return (
    <main className="connections-page app-page page-width">
      <header className="pt-5 sm:pt-7 lg:pt-10">
        <div className="mb-5 lg:hidden">
          <Brand to="/browse" />
        </div>
        <p className="eyebrow">Connections</p>
        <div className="mt-3 max-w-2xl">
          <h1 className="text-[clamp(2rem,9vw,3rem)] font-semibold leading-tight tracking-[-.05em]">
            Likes & matches
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/42">
            Keep track of mutual matches, new interest and the people you noticed.
          </p>
        </div>
      </header>

      <div
        className="mt-6 grid w-full grid-cols-2 gap-1 rounded-xl border border-white/9 bg-[#151513] p-1.5 sm:flex sm:w-fit sm:rounded-lg sm:p-1"
        role="tablist"
        aria-label="Your connections"
      >
        {tabs.map(({ value, label, Icon }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition-colors sm:h-10 sm:min-h-0 sm:flex-none sm:gap-2 sm:rounded-md sm:px-4 sm:text-xs ${
                active
                  ? "bg-white/[.09] text-white"
                  : "text-white/38 hover:bg-white/[.035] hover:text-white/75"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : ""}`} />
              {label}
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] ${
                  active ? "bg-primary/15 text-primary" : "bg-white/[.04] text-white/28"
                }`}
              >
                {summary?.[value].length ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {!summary ? (
        <ConnectionsSkeleton />
      ) : profiles.length ? (
        <div className="connections-grid mt-5 pb-16">
          {profiles.map((profile) => (
            <ConnectionCard key={profile._id} profile={profile} tab={tab} />
          ))}
        </div>
      ) : (
        <Empty tab={tab} />
      )}
    </main>
  );
}

function ConnectionCard({ profile, tab }: { profile: Profile; tab: Tab }) {
  const state = connectionState(tab);
  return (
    <article className="group flex min-w-0 flex-row overflow-hidden rounded-xl border border-white/9 bg-[#181816] transition-colors hover:border-white/18 sm:flex-col sm:rounded-lg">
      <Link
        to="/profile/$id"
        params={{ id: profile._id }}
        className="relative min-h-[190px] w-[34%] shrink-0 overflow-hidden bg-white/5 sm:aspect-[5/4] sm:min-h-0 sm:w-auto"
        aria-label={`View ${profile.displayName}'s profile`}
      >
        {profile.photos[0] ? (
          <img
            src={profile.photos[0]}
            alt={profile.displayName}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl font-black text-primary">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-[#141412]/90 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-lg">
          <state.Icon className="h-3 w-3 text-primary" /> {state.badge}
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-base font-semibold tracking-[-.035em] sm:text-2xl sm:tracking-[-.045em]">
              {profile.displayName}, {calcAge(profile.dateOfBirth)}
            </h2>
            {profile.verified ? (
              <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-[#181816]" />
            ) : null}
          </div>
          <p className="mt-1.5 flex min-w-0 items-center gap-1 text-[10px] text-white/38 sm:text-xs">
            <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{formatLocation(profile)}</span>
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/48 sm:mt-4 sm:min-h-10 sm:text-sm">
          {profile.bio || state.description}
        </p>

        <div className="mt-2 flex min-h-5 flex-wrap gap-1 sm:mt-4 sm:min-h-7 sm:gap-1.5">
          {profile.languages.slice(0, 2).map((language) => (
            <span
              key={language}
              className="profile-chip max-w-full truncate text-[9px] sm:text-[10px]"
            >
              {language}
            </span>
          ))}
          {profile.hobbies.slice(0, 1).map((hobby) => (
            <span
              key={hobby}
              className="profile-chip max-w-full truncate text-[9px] sm:text-[10px]"
            >
              {hobby}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3 sm:mt-5 sm:flex-nowrap sm:gap-3 sm:pt-4">
          <p className="hidden text-[10px] font-semibold text-white/30 sm:block">{state.note}</p>
          <Link
            to="/profile/$id"
            params={{ id: profile._id }}
            className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[10px] font-bold transition-colors sm:flex-none sm:gap-2 sm:rounded-md sm:px-3 sm:text-xs ${
              tab === "matches"
                ? "bg-primary text-white hover:bg-[#ff6797]"
                : "bg-white/[.07] text-white/75 hover:bg-white/[.11] hover:text-white"
            }`}
          >
            {tab === "matches" ? (
              <MessageCircle className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {state.action}
            <ArrowUpRight className="h-3.5 w-3.5" />
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
      note: "Mutual match",
      action: "Open match",
    };
  }
  if (tab === "viewed") {
    return {
      Icon: Sparkles,
      badge: "Viewed you",
      description: "They stopped by your profile. Visit theirs and see if you connect.",
      note: "Profile view",
      action: "View",
    };
  }
  if (tab === "received") {
    return {
      Icon: Heart,
      badge: "Liked you",
      description: "They noticed your profile. See if the feeling is mutual.",
      note: "New interest",
      action: "Review",
    };
  }
  return {
    Icon: Send,
    badge: "You liked",
    description: "You saved this profile to come back to later.",
    note: "Sent like",
    action: "View",
  };
}

function ConnectionsSkeleton() {
  return (
    <div className="connections-grid mt-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-lg border border-white/8 bg-white/[.025]"
        >
          <div className="aspect-[5/4] bg-white/[.045]" />
          <div className="space-y-3 p-5">
            <div className="h-7 w-2/3 rounded bg-white/5" />
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="h-10 rounded bg-white/[.035]" />
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
        : tab === "viewed"
          ? "When someone views your profile, they will show up here."
          : "You haven't sent any likes yet. Explore people who feel like your kind of energy.";
  return (
    <div className="mt-6 max-w-md py-16">
      <span className="grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-white/[.025]">
        <Heart className="h-5 w-5 text-primary" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em]">A little quiet here.</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/40">{copy}</p>
      <Link to="/browse" className="button-primary mt-6">
        Discover people
      </Link>
    </div>
  );
}
