import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireClerkUserId } from "./authHelpers";

export const submit = mutation({
  args: {
    profileId: v.id("profiles"),
    reason: v.union(
      v.literal("fake_profile"),
      v.literal("harassment"),
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { profileId, reason, details }) => {
    const userId = await requireClerkUserId(ctx);
    const reporter = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const reported = await ctx.db.get(profileId);
    if (!reporter || !reported || reported.status === "suspended") {
      throw new Error("This profile is not available.");
    }
    if (reporter._id === profileId) throw new Error("You cannot report your own profile.");
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterProfileId", reporter._id))
      .filter((q) => q.eq(q.field("reportedProfileId"), profileId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();
    if (existing) return { status: "already_reported" as const };
    await ctx.db.insert("reports", {
      reporterProfileId: reporter._id,
      reportedProfileId: profileId,
      reason,
      details: details?.trim().slice(0, 500) || undefined,
      status: "open",
      createdAt: Date.now(),
    });
    return { status: "submitted" as const };
  },
});
