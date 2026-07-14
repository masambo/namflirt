import type { MutationCtx, QueryCtx } from "./_generated/server";

type AuthContext = Pick<QueryCtx | MutationCtx, "auth">;

export async function getClerkUserId(ctx: AuthContext) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

export async function requireClerkUserId(ctx: AuthContext) {
  const userId = await getClerkUserId(ctx);
  if (!userId) throw new Error("You need to sign in first.");
  return userId;
}
