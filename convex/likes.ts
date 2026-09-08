import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { isProfileActive } from "../shared/profileStatus";
import { getClerkUserId } from "./authHelpers";
import { currentUsageDay, normalizePlan, planLimits } from "./plans";
import { createNotification } from "./notificationHelpers";

async function viewerProfile(ctx: MutationCtx) {
  const userId = await getClerkUserId(ctx);
  if (!userId) throw new Error("You need to sign in first.");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile) throw new Error("Complete your profile first.");
  if (!isProfileActive(profile)) throw new Error("Your profile is not available.");
  return profile;
}

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return { received: [], sent: [], matches: [] };
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || !isProfileActive(profile)) return { received: [], sent: [], matches: [] };
    const receivedLikes = await ctx.db
      .query("likes")
      .withIndex("by_to", (q) => q.eq("toProfileId", profile._id))
      .collect();
    const sentLikes = await ctx.db
      .query("likes")
      .withIndex("by_from", (q) => q.eq("fromProfileId", profile._id))
      .collect();
    const receivedIds = new Set<Id<"profiles">>(receivedLikes.map((like) => like.fromProfileId));
    const sentIds = new Set<Id<"profiles">>(sentLikes.map((like) => like.toProfileId));
    const load = async (ids: Set<Id<"profiles">>) =>
      (await Promise.all([...ids].map((id) => ctx.db.get(id)))).filter(
        (profile) => profile && isProfileActive(profile),
      );
    const matches = new Set([...receivedIds].filter((id) => sentIds.has(id)));
    return {
      received: await load(receivedIds),
      sent: await load(sentIds),
      matches: await load(matches),
    };
  },
});

export const status = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return { liked: false, matched: false };
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || !isProfileActive(profile)) return { liked: false, matched: false };
    if (!isProfileActive(await ctx.db.get(profileId))) return { liked: false, matched: false };
    const sent = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) => q.eq("fromProfileId", profile._id).eq("toProfileId", profileId))
      .unique();
    const received = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) => q.eq("fromProfileId", profileId).eq("toProfileId", profile._id))
      .unique();
    return { liked: Boolean(sent), matched: Boolean(sent && received) };
  },
});

export const toggle = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const profile = await viewerProfile(ctx);
    if (profile._id === profileId) throw new Error("You cannot like your own profile.");
    const target = await ctx.db.get(profileId);
    if (!target || !isProfileActive(target)) throw new Error("This profile is not available.");
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) => q.eq("fromProfileId", profile._id).eq("toProfileId", profileId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false, matched: false };
    }
    const day = currentUsageDay();
    const plan = normalizePlan(profile.plan);
    const used = profile.usageDay === day ? (profile.likesUsedToday ?? 0) : 0;
    const limit = planLimits[plan].likesPerDay;
    if (limit !== null && used >= limit)
      throw new Error(
        `Free includes ${limit} likes per day. New members receive Premium for 30 days.`,
      );
    await ctx.db.insert("likes", { fromProfileId: profile._id, toProfileId: profileId });
    await ctx.db.patch(profile._id, {
      usageDay: day,
      likesUsedToday: used + 1,
    });
    const reciprocal = await ctx.db
      .query("likes")
      .withIndex("by_pair", (q) => q.eq("fromProfileId", profileId).eq("toProfileId", profile._id))
      .unique();
    if (reciprocal) {
      await Promise.all([
        createNotification(ctx, {
          recipientProfileId: profile._id,
          actorProfileId: profileId,
          type: "match",
        }),
        createNotification(ctx, {
          recipientProfileId: profileId,
          actorProfileId: profile._id,
          type: "match",
        }),
      ]);
    } else {
      await createNotification(ctx, {
        recipientProfileId: profileId,
        actorProfileId: profile._id,
        type: "like",
      });
    }
    return { liked: true, matched: Boolean(reciprocal) };
  },
});
