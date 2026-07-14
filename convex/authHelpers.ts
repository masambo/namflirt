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

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function configuredAdminUserIds() {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((userId) => userId.trim())
      .filter(Boolean),
  );
}

export function isConfiguredAdmin(userId?: string, email?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  return (
    (normalizedEmail ? configuredAdminEmails().has(normalizedEmail) : false) ||
    (userId ? configuredAdminUserIds().has(userId) : false)
  );
}

export async function getAdminIdentity(ctx: AuthContext) {
  const identity = await ctx.auth.getUserIdentity();
  const email = typeof identity?.email === "string" ? identity.email.toLowerCase() : null;
  if (!identity || !isConfiguredAdmin(identity.subject, email ?? undefined)) return null;
  return { userId: identity.subject, email: email ?? identity.subject };
}

export async function requireAdmin(ctx: AuthContext) {
  const admin = await getAdminIdentity(ctx);
  if (!admin) throw new Error("You do not have permission to access this area.");
  return admin;
}
