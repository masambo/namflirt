import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getClerkUserId } from "./authHelpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return { items: [], unreadCount: 0 };
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return { items: [], unreadCount: 0 };

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientProfileId", profile._id))
      .order("desc")
      .take(40);
    const items = await Promise.all(
      notifications.slice(0, 20).map(async (notification) => ({
        ...notification,
        actor: await ctx.db.get(notification.actorProfileId),
      })),
    );
    return {
      items,
      unreadCount: notifications.filter((notification) => !notification.read).length,
    };
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const notification = await ctx.db.get(notificationId);
    if (!profile || !notification || notification.recipientProfileId !== profile._id) return;
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientProfileId", profile._id))
      .collect();
    await Promise.all(
      notifications
        .filter((notification) => !notification.read)
        .map((notification) => ctx.db.patch(notification._id, { read: true })),
    );
  },
});
