import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Check,
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { PLAN_DEFINITIONS, resolvePlan, type PlanDefinition, type PlanId } from "@/lib/plans";
import { seoHead } from "@/lib/seo";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/plans")({
  head: () =>
    seoHead({
      title: "Dating Plans and Pricing in Namibia | namflirt.",
      description:
        "Compare namflirt. dating plans for Namibia, from a free profile to Premium and VIP features for more likes, messages and profile visibility.",
      path: "/plans",
    }),
  component: Plans,
});

const unavailable = {
  free: ["See who liked you", "Unlimited messages", "Boost profile", "Read receipts"],
  premium: ["Profile boost", "Priority support", "VIP badge"],
  vip: [],
} satisfies Record<PlanId, string[]>;

function Plans() {
  const navigate = useNavigate();
  const configured = Boolean(import.meta.env.VITE_CONVEX_URL);
  const viewer = useQuery(api.profiles.viewer, configured ? {} : "skip") as
    Profile | null | undefined;
  const choosePlan = useMutation(api.profiles.choosePlan);
  const current = resolvePlan(viewer?.plan);

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: viewer ? "/browse" : "/" });
  }

  async function selectPlan(plan: PlanId) {
    if (!configured || !viewer) {
      toast.message("Authentication will be connected later. For now, this is a UI preview.");
      return;
    }
    try {
      await choosePlan({ plan });
      toast.success(`You are now on ${resolvePlan(plan).name}.`);
    } catch {
      toast.error("Plan not updated", { description: "Please try again in a moment." });
    }
  }

  return (
    <div className={viewer ? "min-h-screen pb-24 lg:pb-0 lg:pl-60" : "min-h-screen"}>
      {viewer ? <BottomNav /> : null}
      <main className="plans-page app-page page-width max-w-5xl overflow-x-hidden pb-28">
        <header className="flex items-start gap-3 py-6 sm:items-center sm:gap-4 md:py-8">
          <button type="button" onClick={goBack} className="icon-button" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-[-.055em] sm:text-3xl md:text-5xl">
              Choose your plan
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Unlock better reach, richer access and more ways to connect.
            </p>
          </div>
        </header>

        <section className="plans-grid grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={current.id === plan.id}
              preview={!configured || !viewer}
              onSelect={() => void selectPlan(plan.id)}
            />
          ))}
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <UsageTile
            icon={<MessageCircle />}
            label="Texts this month"
            value={limitText(current.limits.messagesPerMonth, viewer?.messagesUsedThisMonth)}
          />
          <UsageTile
            icon={<Eye />}
            label="Profile views"
            value={limitText(
              current.limits.profileViewsPerMonth,
              viewer?.profileViewsUsedThisMonth,
            )}
          />
          <UsageTile
            icon={<Heart />}
            label="Likes today"
            value={limitText(current.limits.likesPerDay, viewer?.likesUsedToday)}
          />
        </section>
      </main>
    </div>
  );
}

function PlanCard({
  plan,
  current,
  preview,
  onSelect,
}: {
  plan: PlanDefinition;
  current: boolean;
  preview: boolean;
  onSelect: () => void;
}) {
  const features = featuresFor(plan);
  const border =
    plan.tone === "quiet"
      ? "border-white/10"
      : plan.id === "vip"
        ? "border-primary"
        : "border-primary/55";
  const button =
    plan.tone === "quiet"
      ? "bg-white/[.07] text-white/55"
      : "bg-primary text-white shadow-[0_12px_32px_rgba(255,79,135,.2)] hover:brightness-110";

  return (
    <article
      className={`pricing-card relative flex min-h-[520px] w-full min-w-0 flex-col overflow-hidden rounded-[1.7rem] border ${border} bg-card shadow-[0_24px_80px_rgba(0,0,0,.28)]`}
    >
      {plan.badge ? (
        <div className="flex h-8 items-center justify-center bg-primary text-[10px] font-black uppercase text-white shadow-[0_8px_30px_rgba(255,79,135,.25)]">
          {plan.id === "vip" ? "+ " : ""}
          {plan.badge}
        </div>
      ) : null}
      <div className="flex h-full min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <PlanIcon plan={plan.id} />
            <h2
              className={`text-2xl font-black tracking-[-.045em] ${plan.id === "free" ? "text-white" : "text-primary"}`}
            >
              {plan.name}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap text-2xl font-black tracking-[-.055em] text-white sm:text-3xl">
              {plan.price}
              <span className="text-sm font-medium tracking-normal text-white/45">
                {plan.cadence}
              </span>
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-3 text-sm font-bold text-white/90">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> <span>{feature}</span>
            </li>
          ))}
          {unavailable[plan.id].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-white/23">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={current && !preview}
          className={`mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition disabled:cursor-default disabled:opacity-60 ${button}`}
        >
          {current && !preview ? (
            "Current Plan"
          ) : (
            <>
              {" "}
              <PlanButtonIcon plan={plan.id} />{" "}
              {preview ? `Preview ${plan.name}` : `Upgrade to ${plan.name}`}
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function featuresFor(plan: PlanDefinition) {
  if (plan.id === "free") {
    return [
      "10 messages per month",
      "View up to 10 profiles",
      "10 likes per day",
      "Basic match suggestions",
    ];
  }
  if (plan.id === "premium") {
    return [
      "100 messages per month",
      "See who liked you",
      "View up to 100 profiles",
      "Unlimited likes",
      "Advanced filters",
      "Read receipts",
    ];
  }
  return [
    "Everything in Premium",
    "Unlimited messages",
    "Unlimited profile views",
    "Message anyone without matching",
    "VIP badge on profile",
    "Priority in search results",
    "Priority support",
    "Early access to new features",
  ];
}

function PlanIcon({ plan }: { plan: PlanId }) {
  if (plan === "vip") return <Crown className="h-5 w-5 text-primary" />;
  if (plan === "premium") return <Star className="h-5 w-5 text-primary" />;
  return <Zap className="h-5 w-5 text-white/45" />;
}

function PlanButtonIcon({ plan }: { plan: PlanId }) {
  if (plan === "vip") return <Crown className="h-4 w-4" />;
  if (plan === "premium") return <Star className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
}

function UsageTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#191917] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.045] text-primary [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/28">{label}</p>
        <p className="mt-1 text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function limitText(limit: number | null, used = 0) {
  return limit === null ? "Unlimited" : `${used} / ${limit}`;
}
