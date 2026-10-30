import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  isPlaceholderName,
  nameFromEmail,
  removeNewMemberFromName,
} from "../shared/profileName";
import { isProfileActive } from "../shared/profileStatus";

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

function legacyEmailName(email: string) {
  const prefix = email
    .split("@")[0]
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return prefix.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export const listNumberedEmailNames = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("profiles").paginate({ numItems: 100, cursor });
    const profiles = page.page
      .filter(
        (profile) =>
          !!profile.email &&
          /\d/.test(profile.displayName) &&
          legacyEmailName(profile.email) === profile.displayName,
      )
      .map((profile) => ({ profileId: profile._id, email: profile.email! }));
    return { cursor: page.continueCursor, done: page.isDone, profiles };
  },
});

export const applyCleanEmailNames = internalMutation({
  args: {
    updates: v.array(
      v.object({ profileId: v.id("profiles"), displayName: v.string() }),
    ),
  },
  handler: async (ctx, { updates }) => {
    let updated = 0;
    for (const update of updates) {
      const profile = await ctx.db.get(update.profileId);
      if (!profile || !profile.email || !/\d/.test(profile.displayName)) continue;
      if (legacyEmailName(profile.email) !== profile.displayName) continue;
      await ctx.db.patch(profile._id, { displayName: update.displayName });
      updated += 1;
    }
    return updated;
  },
});

export const removeNumbersFromEmailNames = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let candidates = 0;
    let updated = 0;
    while (true) {
      const batch: {
        cursor: string | null;
        done: boolean;
        profiles: Array<{ profileId: Id<"profiles">; email: string }>;
      } = await ctx.runMutation(internal.profileMigrations.listNumberedEmailNames, { cursor });
      candidates += batch.profiles.length;
      const updates = batch.profiles.map((profile) => ({
        profileId: profile.profileId,
        displayName: nameFromEmail(profile.email),
      }));
      updated += await ctx.runMutation(internal.profileMigrations.applyCleanEmailNames, { updates });
      if (batch.done) return { candidates, updated };
      cursor = batch.cursor;
    }
  },
});

export const emailExistingLikeBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()), startDelayMs: v.number() },
  handler: async (ctx, { cursor, startDelayMs }) => {
    const page = await ctx.db.query("likes").paginate({ numItems: 100, cursor });
    let scheduled = 0;
    let skipped = 0;
    for (const like of page.page) {
      if (like.emailNotified) continue;
      const [actor, recipient] = await Promise.all([
        ctx.db.get(like.fromProfileId),
        ctx.db.get(like.toProfileId),
      ]);
      if (
        !actor ||
        !recipient ||
        !isProfileActive(actor) ||
        !isProfileActive(recipient) ||
        !recipient.email ||
        recipient.emailNotifications === false ||
        recipient.isDemo
      ) {
        skipped += 1;
        continue;
      }
      const reciprocal = await ctx.db
        .query("likes")
        .withIndex("by_pair", (q) =>
          q.eq("fromProfileId", like.toProfileId).eq("toProfileId", like.fromProfileId),
        )
        .unique();
      await ctx.scheduler.runAfter(startDelayMs + scheduled * 125, internal.emails.sendActivityEmail, {
        to: recipient.email,
        recipientName: recipient.displayName,
        actorName: actor.displayName,
        actorProfileId: actor._id,
        actorPhotoUrl: actor.photos[0],
        actorBio: actor.bio,
        event: reciprocal ? "match" : "like",
      });
      await ctx.db.patch(like._id, { emailNotified: true });
      scheduled += 1;
    }
    return { cursor: page.continueCursor, done: page.isDone, scheduled, skipped };
  },
});

export const emailExistingLikesAndMatches = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let scheduled = 0;
    let skipped = 0;
    while (true) {
      const batch: {
        cursor: string | null;
        done: boolean;
        scheduled: number;
        skipped: number;
      } = await ctx.runMutation(internal.profileMigrations.emailExistingLikeBatch, {
        cursor,
        startDelayMs: scheduled * 125,
      });
      scheduled += batch.scheduled;
      skipped += batch.skipped;
      if (batch.done) return { scheduled, skipped };
      cursor = batch.cursor;
    }
  },
});

export const listNamesWithNewMemberParts = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("profiles").paginate({ numItems: 100, cursor });
    const profiles = page.page
      .map((profile) => ({
        profileId: profile._id,
        currentName: profile.displayName,
        displayName: removeNewMemberFromName(profile.displayName, profile.email),
      }))
      .filter(
        ({ currentName, displayName }) =>
          currentName !== displayName &&
          (/^\s*new\s+member\b/i.test(currentName) || /\bnew\s+member(?:\s+\d+)?\s*$/i.test(currentName)),
      )
      .map(({ profileId, displayName }) => ({ profileId, displayName }));
    return { cursor: page.continueCursor, done: page.isDone, profiles };
  },
});

export const applyNewMemberNameCleanup = internalMutation({
  args: {
    updates: v.array(
      v.object({ profileId: v.id("profiles"), displayName: v.string() }),
    ),
  },
  handler: async (ctx, { updates }) => {
    let updated = 0;
    for (const update of updates) {
      const profile = await ctx.db.get(update.profileId);
      if (!profile) continue;
      const cleanedName = removeNewMemberFromName(profile.displayName, profile.email);
      if (cleanedName !== update.displayName || cleanedName === profile.displayName) continue;
      await ctx.db.patch(profile._id, { displayName: cleanedName });
      updated += 1;
    }
    return updated;
  },
});

export const removeNewMemberNameParts = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let candidates = 0;
    let updated = 0;
    while (true) {
      const batch: {
        cursor: string | null;
        done: boolean;
        profiles: Array<{ profileId: Id<"profiles">; displayName: string }>;
      } = await ctx.runMutation(internal.profileMigrations.listNamesWithNewMemberParts, { cursor });
      candidates += batch.profiles.length;
      updated += await ctx.runMutation(internal.profileMigrations.applyNewMemberNameCleanup, {
        updates: batch.profiles,
      });
      if (batch.done) return { candidates, updated };
      cursor = batch.cursor;
    }
  },
});
