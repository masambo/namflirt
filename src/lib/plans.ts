export type PlanId = "free" | "premium" | "vip";

export interface PlanLimit {
  messagesPerMonth: number | null;
  profileViewsPerMonth: number | null;
  likesPerDay: number | null;
  directMessages: boolean;
  readReceipts: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  tone: "quiet" | "gold" | "sun";
  badge?: string;
  limits: PlanLimit;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    cadence: "",
    tone: "quiet",
    limits: {
      messagesPerMonth: 10,
      profileViewsPerMonth: 10,
      likesPerDay: 10,
      directMessages: false,
      readReceipts: false,
    },
  },
  {
    id: "premium",
    name: "Premium",
    price: "N$149",
    cadence: "/mo",
    tone: "gold",
    badge: "Most popular",
    limits: {
      messagesPerMonth: 100,
      profileViewsPerMonth: 100,
      likesPerDay: null,
      directMessages: false,
      readReceipts: true,
    },
  },
  {
    id: "vip",
    name: "VIP",
    price: "N$299",
    cadence: "/mo",
    tone: "sun",
    badge: "Best value",
    limits: {
      messagesPerMonth: null,
      profileViewsPerMonth: null,
      likesPerDay: null,
      directMessages: true,
      readReceipts: true,
    },
  },
];

export const PLAN_BY_ID = Object.fromEntries(
  PLAN_DEFINITIONS.map((plan) => [plan.id, plan]),
) as Record<PlanId, PlanDefinition>;

export function resolvePlan(plan?: string | null) {
  return PLAN_BY_ID[plan as PlanId] ?? PLAN_BY_ID.free;
}

export function formatLimit(value: number | null, noun: string) {
  return value === null ? `Unlimited ${noun}` : `${value} ${noun}`;
}
