import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Flag,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MatchCelebration } from "@/components/MatchCelebration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
type ReportReason = "fake_profile" | "harassment" | "spam" | "inappropriate" | "other";

function ProfileView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [target, setTarget] = useState<Profile | null>(null);
  const [loadIssue, setLoadIssue] = useState<ProfileLoadIssue | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("fake_profile");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const viewer = useQuery(api.profiles.viewer, {}) as
    (Profile & { preferences: Preferences | null }) | null | undefined;
  const likeStatus = useQuery(api.likes.status, { profileId: id }) as
    { liked: boolean; matched: boolean } | undefined;
  const viewProfile = useMutation(api.profiles.viewProfile);
  const toggleLike = useMutation(api.likes.toggle);
  const startConversation = useMutation(api.conversations.start);
  const submitReport = useMutation(api.reports.submit);

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

  async function report() {
    setReporting(true);
    try {
      const result = await submitReport({
        profileId: id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportOpen(false);
      setReportDetails("");
      toast.success(
        result.status === "already_reported" ? "Report already received." : "Report received.",
        { description: "Our safety team will review this profile." },
      );
    } catch {
      toast.error("Report not sent", { description: "Please try again in a moment." });
    } finally {
      setReporting(false);
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
            <button
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/30 transition hover:text-red-300"
            >
              <Flag className="h-3.5 w-3.5" /> Report this profile
            </button>
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
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-white/10 bg-[#191917] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report {target?.displayName ?? "this profile"}</DialogTitle>
            <DialogDescription className="text-white/45">
              Reports are private. Choose the concern that best describes what happened.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="block">
              <span className="admin-label">Reason</span>
              <select
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value as ReportReason)}
                className="admin-input mt-2 w-full"
              >
                <option value="fake_profile" className="bg-[#191917]">
                  Fake or misleading profile
                </option>
                <option value="harassment" className="bg-[#191917]">
                  Harassment or threatening behavior
                </option>
                <option value="spam" className="bg-[#191917]">
                  Spam or solicitation
                </option>
                <option value="inappropriate" className="bg-[#191917]">
                  Inappropriate content
                </option>
                <option value="other" className="bg-[#191917]">
                  Something else
                </option>
              </select>
            </label>
            <label className="block">
              <span className="admin-label">Details (optional)</span>
              <textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value.slice(0, 500))}
                placeholder="Add anything that will help our review."
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-white/10 bg-white/[.025] p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
              />
              <span className="mt-1 block text-right text-[10px] text-white/25">
                {reportDetails.length}/500
              </span>
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setReportOpen(false)} className="admin-button-secondary">
              Cancel
            </button>
            <button
              onClick={() => void report()}
              disabled={reporting}
              className="admin-button-primary"
            >
              {reporting ? "Sending..." : "Submit report"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileLoadFeedback({ issue }: { issue: ProfileLoadIssue }) {
  const content = {
    plan_limit: {
      eyebrow: "Plan limit",
      title: "You've used this month's profile views.",
      copy: "Premium trial access is available while payment setup is being completed.",
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
