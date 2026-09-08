import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAdmin, requireClerkUserId } from "./authHelpers";
import { isProfileActive } from "../shared/profileStatus";

async function member(ctx: QueryCtx) {
  const userId = await requireClerkUserId(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile || !isProfileActive(profile))
    throw new ConvexError("Your profile is not available.");
  return profile;
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    const profile = await member(ctx);
    const request = await ctx.db
      .query("verificationRequests")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
    return {
      verified: profile.verified,
      request: request
        ? {
            status: request.status,
            submittedAt: request.submittedAt,
            feedback: request.feedback,
          }
        : null,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await member(ctx);
    if (!profile.completed || !profile.photos.length)
      throw new ConvexError("Complete your profile and add a photo first.");
    if (profile.verified) throw new ConvexError("Your profile is already verified.");
    const request = await ctx.db
      .query("verificationRequests")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
    if (request?.status === "pending")
      throw new ConvexError("Your verification is already awaiting review.");
    return ctx.storage.generateUploadUrl();
  },
});

export const submit = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const profile = await member(ctx);
    if (!profile.completed || !profile.photos.length)
      throw new ConvexError("Complete your profile and add a photo first.");
    if (profile.verified) throw new ConvexError("Your profile is already verified.");
    const existing = await ctx.db
      .query("verificationRequests")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .unique();
    if (existing?.status === "pending")
      throw new ConvexError("Your verification is already awaiting review.");
    const file = await ctx.db.system.get(storageId);
    if (
      !file ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.contentType ?? "") ||
      file.size > 8_000_000
    )
      throw new ConvexError("Upload a JPG, PNG, or WebP selfie smaller than 8 MB.");
    const selfieUrl = await ctx.storage.getUrl(storageId);
    if (!selfieUrl || profile.photos.includes(selfieUrl))
      throw new ConvexError("Take a new selfie for verification.");
    const values = {
      profileId: profile._id,
      selfieStorageId: storageId,
      status: "pending" as const,
      submittedAt: Date.now(),
      reviewedAt: undefined,
      reviewedBy: undefined,
      feedback: undefined,
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("verificationRequests", values);
  },
});

export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const requests = await ctx.db
      .query("verificationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(100);
    return Promise.all(
      requests.map(async (request) => {
        const profile = await ctx.db.get(request.profileId);
        return {
          _id: request._id,
          submittedAt: request.submittedAt,
          selfieUrl: request.selfieStorageId
            ? await ctx.storage.getUrl(request.selfieStorageId)
            : null,
          profile: profile
            ? {
                _id: profile._id,
                displayName: profile.displayName,
                photos: profile.photos,
                available: isProfileActive(profile) && profile.completed,
                userId: profile.userId,
              }
            : null,
        };
      }),
    );
  },
});

export const review = mutation({
  args: {
    requestId: v.id("verificationRequests"),
    decision: v.union(v.literal("approved"), v.literal("declined")),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, decision, feedback }) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending")
      throw new ConvexError("This request has already been reviewed or is unavailable.");
    const profile = await ctx.db.get(request.profileId);
    if (profile?.userId === admin.userId)
      throw new ConvexError("Another admin must review your verification.");
    const note = feedback?.trim().slice(0, 300);
    if (decision === "declined" && !note)
      throw new ConvexError("Explain what the member should change before trying again.");
    if (decision === "approved") {
      if (
        !profile ||
        !isProfileActive(profile) ||
        !profile.completed ||
        !profile.photos.length ||
        !request.selfieStorageId
      )
        throw new ConvexError("This profile cannot be verified.");
      await ctx.db.patch(profile._id, { verified: true });
    }
    if (request.selfieStorageId) await ctx.storage.delete(request.selfieStorageId);
    await ctx.db.patch(requestId, {
      status: decision,
      selfieStorageId: undefined,
      reviewedAt: Date.now(),
      reviewedBy: admin.userId,
      feedback: note,
    });
    await ctx.db.insert("adminAudit", {
      adminUserId: admin.userId,
      action: `verification_${decision}`,
      targetProfileId: request.profileId,
      details: note,
      createdAt: Date.now(),
    });
  },
});
