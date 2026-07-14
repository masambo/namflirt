import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useClerk } from "@clerk/react";
import {
  BadgeCheck,
  CalendarCheck,
  Crown,
  Edit3,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { calcAge } from "@/lib/constants";
import { resolvePlan } from "@/lib/plans";
import type { Profile } from "@/lib/types";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/me")({ component: Me });

function Me() {
  const profile = useQuery(api.profiles.viewer, {}) as Profile | null | undefined;
  const adminAccess = useQuery(api.admin.access, {}) as { isAdmin: boolean } | undefined;
  const { signOut } = useClerk();
  const navigate = useNavigate();
  if (!profile)
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm text-white/30">
        Loading profile...
      </div>
    );
  const plan = resolvePlan(profile.plan);

  return (
    <main className="app-page page-width max-w-6xl">
      <header className="flex items-center justify-between py-6 md:py-8">
        <div className="lg:hidden">
          <Brand to="/browse" />
        </div>
        <Link to="/onboarding" className="button-ghost">
          <Edit3 className="h-4 w-4" /> Edit profile
        </Link>
      </header>
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative min-h-[620px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1b1b18]">
          {profile.photos[0] ? (
            <img
              src={profile.photos[0]}
              alt={profile.displayName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/15" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <div className="flex items-center gap-2">
              <h1 className="text-5xl font-semibold tracking-[-.065em]">
                {profile.displayName}, {calcAge(profile.dateOfBirth)}
              </h1>
              {profile.verified ? <BadgeCheck className="h-6 w-6 fill-primary text-black" /> : null}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/55">
              <MapPin className="h-4 w-4" /> {profile.town}, {profile.region}
            </p>
          </div>
        </section>
        <section className="space-y-4 pb-20">
          <div className="rounded-[2rem] border border-white/8 bg-[#191917] p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Your profile</p>
              <Link
                to="/plans"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[.045] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-white/55"
              >
                <Crown className="h-3.5 w-3.5 text-primary" /> {plan.name}
              </Link>
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.055em]">
              Looking good, {profile.displayName.split(" ")[0]}.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/40">
              Keep your profile current. Small details give the right person a much better way to
              say hello.
            </p>
            {plan.id === "premium" ? (
              <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
                    <CalendarCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">
                      Congratulations, your 14-day Premium trial is active.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Plan changes and VIP access are paused while the payment gateway is being
                      completed.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-7 grid grid-cols-3 gap-2">
              <Stat value={profile.photos.length} label="Photos" />
              <Stat value={profile.languages.length} label="Languages" />
              <Stat value={profile.hobbies.length} label="Interests" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/8 bg-[#191917] p-7">
            <p className="eyebrow">About you</p>
            <p className="mt-4 text-xl leading-relaxed text-white/75">{profile.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.hobbies.map((hobby) => (
                <span key={hobby} className="profile-chip">
                  {hobby}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {adminAccess?.isAdmin ? (
              <Link to="/admin" className="settings-row sm:col-span-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>Admin dashboard</span>
              </Link>
            ) : null}
            <Link to="/onboarding" className="settings-row">
              <Settings className="h-4 w-4" />
              <span>Edit preferences</span>
            </Link>
            <Link to="/likes" className="settings-row">
              <Sparkles className="h-4 w-4" />
              <span>See connections</span>
            </Link>
            <Link to="/plans" className="settings-row sm:col-span-2">
              <Crown className="h-4 w-4" />
              <span>Premium trial</span>
              <span className="ml-auto text-xs text-white/30">{plan.name}</span>
            </Link>
          </div>
          <button
            onClick={async () => {
              await signOut();
              await navigate({ to: "/" });
            }}
            className="settings-row w-full text-white/45 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.035] p-4 text-center">
      <p className="text-3xl font-semibold tracking-[-.05em]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white/25">
        {label}
      </p>
    </div>
  );
}
