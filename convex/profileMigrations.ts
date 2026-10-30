import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { isPlaceholderName, nameFromEmail } from "../shared/profileName";

export const listPlaceholderBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("profiles").paginate({ numItems: 100, cursor });
    const profiles = page.page
      .filter((profile) => isPlaceholderName(profile.displayName))
      .map((profile) => ({
        profileId: profile._id,
        userId: profile.userId,
        email: profile.email,
      }));
    return { cursor: page.continueCursor, done: page.isDone, profiles };
  },
});

export const applyNameBatch = internalMutation({
  args: {
    updates: v.array(
      v.object({
        profileId: v.id("profiles"),
        displayName: v.string(),
        email: v.string(),
      }),
    ),
  },
  handler: async (ctx, { updates }) => {
    let updated = 0;
    for (const update of updates) {
      const profile = await ctx.db.get(update.profileId);
      if (!profile || !isPlaceholderName(profile.displayName)) continue;
      await ctx.db.patch(profile._id, {
        displayName: update.displayName,
        email: update.email,
      });
      updated += 1;
    }
    return updated;
  },
});

type ClerkUser = {
  primary_email_address_id?: string | null;
  email_addresses?: Array<{
    id: string;
    email_address: string;
    verification?: { status?: string } | null;
  }>;
};

export const backfillPlaceholderNames = internalAction({
  args: {},
  handler: async (ctx) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error("Set CLERK_SECRET_KEY on the production Convex deployment.");

    let cursor: string | null = null;
    let placeholders = 0;
    let updated = 0;
    let skippedNoEmail = 0;
    let failedLookups = 0;

    while (true) {
      const batch: {
        cursor: string | null;
        done: boolean;
        profiles: Array<{ profileId: Id<"profiles">; userId?: string; email?: string }>;
      } = await ctx.runMutation(internal.profileMigrations.listPlaceholderBatch, { cursor });
      placeholders += batch.profiles.length;
      const updates: Array<{
        profileId: (typeof batch.profiles)[number]["profileId"];
        displayName: string;
        email: string;
      }> = [];

      for (let index = 0; index < batch.profiles.length; index += 5) {
        const chunk = batch.profiles.slice(index, index + 5);
        const results = await Promise.all(
          chunk.map(async (profile) => {
            let email = profile.email;
            if (!email && profile.userId) {
              try {
                const response = await fetch(
                  `https://api.clerk.com/v1/users/${encodeURIComponent(profile.userId)}`,
                  { headers: { Authorization: `Bearer ${secretKey}` } },
                );
                if (!response.ok) return { kind: "failed" as const };
                const user = (await response.json()) as ClerkUser;
                const addresses = user.email_addresses ?? [];
                const primary = addresses.find(
                  (address) => address.id === user.primary_email_address_id,
                );
                email =
                  primary?.verification?.status === "verified"
                    ? primary.email_address
                    : addresses.find((address) => address.verification?.status === "verified")
                        ?.email_address;
              } catch {
                return { kind: "failed" as const };
              }
            }
            if (!email) return { kind: "missing" as const };
            const displayName = nameFromEmail(email);
            return displayName
              ? { kind: "ready" as const, profileId: profile.profileId, displayName, email }
              : { kind: "missing" as const };
          }),
        );

        for (const result of results) {
          if (result.kind === "ready")
            updates.push({
              profileId: result.profileId,
              displayName: result.displayName,
              email: result.email,
            });
          else if (result.kind === "failed") failedLookups += 1;
          else skippedNoEmail += 1;
        }
      }

      updated += await ctx.runMutation(internal.profileMigrations.applyNameBatch, { updates });
      if (batch.done) return { placeholders, updated, skippedNoEmail, failedLookups };
      cursor = batch.cursor;
    }
  },
});
