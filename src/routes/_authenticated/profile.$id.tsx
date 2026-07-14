import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MatchCelebration } from "@/components/MatchCelebration";
import { calcAge } from "@/lib/constants";
import { calcMatch } from "@/lib/match";
import type { Preferences, Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/profile/$id")({ component: ProfileView });

type ProfileLoadIssue = "plan_limit" | "profile_required" | "not_found" | "unexpected";
type ProfileLoadResult =
  | { status: "ready"; profile: Profile }
  | { status: "plan_limit"; plan: string; limit: number }
  | { status: "profile_required" | "not_found" };
type StartConversationResult =
  | { status: "ready"; conversationId: string }
  | { status: "match_required" }
  | { status: "self" }
  | { status: "not_found" };

function ProfileView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState<Profile | null>(null);
  const [loadIssue, setLoadIssue] = useState<ProfileLoadIssue | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const viewer = useQuery(api.profiles.viewer, {}) as
    (Profile & { preferences: Preferences | null }) | null | undefined;
  const likeStatus = useQuery(api.likes.status, { profileId: id }) as
    { liked: boolean; matched: boolean } | undefined;
  const viewProfile = useMutation(api.profiles.viewProfile);
  const toggleLike = useMutation(api.likes.toggle);
  const startConversation = useMutation(api.conversations.start);

  useEffect(() => {
    let active = true;
    setTarget(null);
    setLoadIssue(null);
    void viewProfile({ profileId: id })
      .then((result: ProfileLoadResult) => {
        if (!active) return;
        if (result.status === "ready") {
          setTarget(result.profile);
          return;
        }
        setLoadIssue(result.status);
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error("Profile could not be opened.", error);
        if (active) setLoadIssue("unexpected");
      });
    return () => {
      active = false;
    };
  }, [id, viewProfile]);

  if (loadIssue) return <ProfileLoadFeedback issue={loadIssue} />;

  if (!target || !viewer || !likeStatus)
    return (
      <div className="grid min-h-[70vh] place-items-center text-sm text-white/30">
        Loading profile...
      </div>
    );
  const match = calcMatch(
    viewer,
    viewer.preferences ?? {
      minAge: 20,
      maxAge: 45,
      preferredRegions: [],
      preferredLanguages: [],
      preferredTribes: [],
      tribeImportance: "open_to_all",
      preferredHobbies: [],
      openToLongDistance: true,
    },
    target,
  );

  async function like() {
    try {
      const result = await toggleLike({ profileId: id });
      if (result.matched) {
        setMatchOpen(true);
        return;
      }
      toast.success(result.liked ? "Like sent." : "Like removed.");
    } catch {
      toast.error("Like not updated", { description: "Please try again in a moment." });
    }
  }

  async function message() {
    try {
      const result = (await startConversation({ profileId: id })) as StartConversationResult;
      if (result.status === "match_required") {
        toast.info("Match first", {
          description:
            "You can start chatting after you both like each other. VIP can message before matching.",
          id: "conversation-match-required",
        });
        return;
      }
      if (result.status === "self") {
        toast.info("This is your profile", {
          description: "Choose another profile to start a conversation.",
        });
        return;
      }
      if (result.status === "not_found") {
        toast.error("Profile unavailable", {
          description: "This profile can no longer receive messages.",
        });
        return;
      }
      await navigate({ to: "/messages/$id", params: { id: result.conversationId } });
    } catch {
      toast.error("Conversation not started", { description: "Please try again in a moment." });
    }
  }

  return (
    <>
      <main className="app-page page-width max-w-6xl pt-4 md:pt-8">
        <Link to="/browse" className="button-ghost">
          <ArrowLeft className="h-4 w-4" /> Discover
        </Link>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <section className="relative min-h-[650px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1b1b18] lg:sticky lg:top-5 lg:h-[calc(100vh-3rem)] lg:min-h-[700px]">
            {target.photos[0] ? (
              <img
                src={target.photos[0]}
                alt={target.displayName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
            <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-2 text-xs font-black text-white shadow-[0_8px_24px_rgba(255,79,135,.3)]">
              {match.score}% fit
            </span>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <h1 className="text-5xl font-semibold tracking-[-.065em] sm:text-7xl">
                  {target.displayName}, {calcAge(target.dateOfBirth)}
                </h1>
                {target.verified ? (
                  <BadgeCheck className="h-7 w-7 fill-primary text-black" />
                ) : null}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/60">
                <MapPin className="h-4 w-4" /> {target.town}, {target.region}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={like}
                  className={`grid h-14 w-14 place-items-center rounded-full border transition ${likeStatus.liked ? "border-primary bg-primary text-white" : "border-white/15 bg-black/25 backdrop-blur-lg hover:bg-white hover:text-black"}`}
                  aria-label={likeStatus.liked ? "Remove like" : "Like profile"}
                >
                  <Heart className={`h-5 w-5 ${likeStatus.liked ? "fill-current" : ""}`} />
                </button>
                <button onClick={message} className="button-primary flex-1 justify-center">
                  <MessageCircle className="h-4 w-4" />{" "}
                  {likeStatus.matched ? "Message your match" : "Message with VIP"}
                </button>
              </div>
            </div>
          </section>
          <section className="space-y-4 pb-20">
            <ProfileSection label="About">
              <p className="text-xl leading-relaxed tracking-[-.02em] text-white/80">
                {target.bio || "Still writing their story."}
              </p>
            </ProfileSection>
            <ProfileSection label="Why you fit">
              <div className="space-y-3">
                {match.sharedLanguages.length ? (
                  <Reason
                    icon={<Languages />}
                    text={
                      <>
                        You both speak <strong>{match.sharedLanguages.join(" and ")}</strong>
                      </>
                    }
                  />
                ) : null}
                {match.sharedHobbies.length ? (
                  <Reason
                    icon={<Sparkles />}
                    text={
                      <>
                        Shared energy around <strong>{match.sharedHobbies.join(", ")}</strong>
                      </>
                    }
                  />
                ) : null}
                {target.region === viewer.region ? (
                  <Reason
                    icon={<MapPin />}
                    text={
                      <>
                        You're both rooted in <strong>{target.region}</strong>
                      </>
                    }
                  />
                ) : null}
              </div>
            </ProfileSection>
            {target.photos.length > 1 ? (
              <ProfileSection label="A little more">
                <div className="grid grid-cols-2 gap-3">
                  {target.photos.slice(1).map((photo, index) => (
                    <img
                      key={photo}
                      src={photo}
                      alt={`${target.displayName} photo ${index + 2}`}
                      loading="lazy"
                      className="aspect-[.8] w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </ProfileSection>
            ) : null}
            <ProfileSection label="The details">
              <div className="grid grid-cols-2 gap-2">
                <Detail label="Looking for" value={target.relationshipGoal} />
                <Detail label="Culture" value={target.tribe} />
                <Detail label="Languages" value={target.languages.join(", ")} />
                <Detail label="Work" value={target.occupation} />
                <Detail label="Education" value={target.education} />
                <Detail label="Faith" value={target.religion} />
              </div>
            </ProfileSection>
            {target.hobbies.length ? (
              <ProfileSection label="Into">
                <div className="flex flex-wrap gap-2">
                  {target.hobbies.map((hobby) => (
                    <span className="profile-chip" key={hobby}>
                      {hobby}
                    </span>
                  ))}
                </div>
              </ProfileSection>
            ) : null}
          </section>
        </div>
      </main>
      <MatchCelebration
        open={matchOpen}
        onOpenChange={setMatchOpen}
        viewer={viewer}
        match={target}
        onMessage={() => {
          setMatchOpen(false);
          void message();
        }}
      />
    </>
  );
}

function ProfileLoadFeedback({ issue }: { issue: ProfileLoadIssue }) {
  const content = {
    plan_limit: {
      eyebrow: "Plan limit",
      title: "You've used this month's profile views.",
      copy: "Upgrade your plan to keep discovering profiles without a monthly viewing limit.",
      action: "See plans",
      to: "/plans" as const,
    },
    profile_required: {
      eyebrow: "Profile needed",
      title: "Complete your profile first.",
      copy: "Finish your profile so we can personalize the people you discover.",
      action: "Complete profile",
      to: "/onboarding" as const,
    },
    not_found: {
      eyebrow: "Profile unavailable",
      title: "This profile isn't available.",
      copy: "It may have been removed or is no longer visible.",
      action: "Back to discover",
      to: "/browse" as const,
    },
    unexpected: {
      eyebrow: "Something went wrong",
      title: "We couldn't open this profile.",
      copy: "Return to Discover and try again in a moment.",
      action: "Back to discover",
      to: "/browse" as const,
    },
  }[issue];

  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="eyebrow justify-center">{content.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.055em]">{content.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
          {content.copy}
        </p>
        <Link to={content.to} className="button-primary mt-7">
          {content.action}
        </Link>
      </div>
    </div>
  );
}

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/8 bg-[#191917] p-6 sm:p-8">
      <p className="eyebrow">{label}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Reason({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3 text-sm text-white/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return value ? (
    <div className="rounded-2xl bg-white/[.035] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/25">{label}</p>
      <p className="mt-1.5 text-sm font-semibold capitalize text-white/75">{value}</p>
    </div>
  ) : null;
}
