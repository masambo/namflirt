export type PlanId = "free" | "premium" | "vip";

export const planLimits: Record<
  PlanId,
  {
    messagesPerMonth: number | null;
    profileViewsPerMonth: number | null;
    likesPerDay: number | null;
    directMessages: boolean;
    readReceipts: boolean;
  }
> = {
  free: {
    messagesPerMonth: 10,
    profileViewsPerMonth: 10,
    likesPerDay: 10,
    directMessages: false,
    readReceipts: false,
  },
  premium: {
    messagesPerMonth: 100,
    profileViewsPerMonth: 100,
    likesPerDay: null,
    directMessages: false,
    readReceipts: true,
  },
  vip: {
    messagesPerMonth: null,
    profileViewsPerMonth: null,
    likesPerDay: null,
    directMessages: true,
    readReceipts: true,
  },
};

export function normalizePlan(plan?: string): PlanId {
  return plan === "premium" || plan === "vip" ? plan : "free";
}

export function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function currentUsageDay() {
  return new Date().toISOString().slice(0, 10);
}
