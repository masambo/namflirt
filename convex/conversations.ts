import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { isProfileActive } from "../shared/profileStatus";
import { getClerkUserId } from "./authHelpers";
import { currentUsageMonth, normalizePlan, planLimits } from "./plans";
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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || !isProfileActive(profile)) return [];
    const [asA, asB] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_a", (q) => q.eq("userA", profile._id))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_b", (q) => q.eq("userB", profile._id))
        .collect(),
    ]);
    const rows = await Promise.all(
      [...asA, ...asB].map(async (conversation) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();
        return {
          ...conversation,
          other: await ctx.db.get(
            conversation.userA === profile._id ? conversation.userB : conversation.userA,
          ),
          unreadCount: messages.filter(
            (message) => message.senderProfileId !== profile._id && !message.readAt,
          ).length,
        };
      }),
    );
    return rows
      .filter((row) => isProfileActive(row.other))
      .sort((a, b) => (b.lastMessageAt ?? b._creationTime) - (a.lastMessageAt ?? a._creationTime));
  },
});

export const start = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const profile = await viewerProfile(ctx);
    const plan = normalizePlan(profile.plan);
    if (profile._id === profileId) return { status: "self" as const };
    const target = await ctx.db.get(profileId);
    if (!target || !target.completed || !isProfileActive(target))
      return { status: "not_found" as const };
    const [userA, userB] =
      String(profile._id) < String(profileId) ? [profile._id, profileId] : [profileId, profile._id];
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_pair", (q) => q.eq("userA", userA).eq("userB", userB))
      .unique();
    if (existing) return { status: "ready" as const, conversationId: existing._id };

    if (!planLimits[plan].directMessages) {
      const sent = await ctx.db
        .query("likes")
        .withIndex("by_pair", (q) =>
          q.eq("fromProfileId", profile._id).eq("toProfileId", profileId),
        )
        .unique();
      const received = await ctx.db
        .query("likes")
        .withIndex("by_pair", (q) =>
          q.eq("fromProfileId", profileId).eq("toProfileId", profile._id),
        )
        .unique();
      if (!sent || !received) return { status: "match_required" as const };
    }
    const conversationId = await ctx.db.insert("conversations", { userA, userB });
    return { status: "ready" as const, conversationId };
  },
});

export const detail = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const conversation = await ctx.db.get(conversationId);
    if (
      !profile ||
      !isProfileActive(profile) ||
      !conversation ||
      (conversation.userA !== profile._id && conversation.userB !== profile._id)
    )
      return null;
    const other = await ctx.db.get(
      conversation.userA === profile._id ? conversation.userB : conversation.userA,
    );
    if (!isProfileActive(other)) return null;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    return {
      conversation,
      other,
      messages,
      viewerProfileId: profile._id,
      canSeeReadReceipts: planLimits[normalizePlan(profile.plan)].readReceipts,
    };
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const profile = await viewerProfile(ctx);
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || (conversation.userA !== profile._id && conversation.userB !== profile._id))
      return;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    const readAt = Date.now();
    await Promise.all(
      messages
        .filter((message) => message.senderProfileId !== profile._id && !message.readAt)
        .map((message) => ctx.db.patch(message._id, { readAt })),
    );
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const profile = await viewerProfile(ctx);
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || (conversation.userA !== profile._id && conversation.userB !== profile._id))
      return { status: "not_found" as const };
    const clean = body.trim().slice(0, 1000);
    if (!clean) return { status: "empty" as const };
    const recipientId =
      conversation.userA === profile._id ? conversation.userB : conversation.userA;
    const recipient = await ctx.db.get(recipientId);
    if (!recipient || !isProfileActive(recipient)) return { status: "not_found" as const };
    const month = currentUsageMonth();
    const plan = normalizePlan(profile.plan);
    const used = profile.usageMonth === month ? (profile.messagesUsedThisMonth ?? 0) : 0;
    const limit = planLimits[plan].messagesPerMonth;
    if (limit !== null && used >= limit) {
      return { status: "plan_limit" as const, plan, limit };
    }
    const createdAt = Date.now();
    const id = await ctx.db.insert("messages", {
      conversationId,
      senderProfileId: profile._id,
      body: clean,
      createdAt,
    });
    await ctx.db.patch(conversationId, { lastMessage: clean, lastMessageAt: createdAt });
    await ctx.db.patch(profile._id, {
      usageMonth: month,
      messagesUsedThisMonth: used + 1,
      profileViewsUsedThisMonth:
        profile.usageMonth === month ? (profile.profileViewsUsedThisMonth ?? 0) : 0,
    });
    await createNotification(ctx, {
      recipientProfileId: recipientId,
      actorProfileId: profile._id,
      type: "message",
      conversationId,
      messagePreview: clean.slice(0, 80),
    });
    return { status: "sent" as const, messageId: id };
  },
});
