import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    displayName: v.string(),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    bio: v.optional(v.string()),
    region: v.optional(v.string()),
    town: v.optional(v.string()),
    tribe: v.optional(v.string()),
    languages: v.array(v.string()),
    hobbies: v.array(v.string()),
    lifestyle: v.array(v.string()),
    relationshipGoal: v.optional(v.string()),
    religion: v.optional(v.string()),
    education: v.optional(v.string()),
    occupation: v.optional(v.string()),
    photos: v.array(v.string()),
    verified: v.boolean(),
    completed: v.boolean(),
    isDemo: v.boolean(),
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"))),
    moderationNote: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("premium"), v.literal("vip"))),
    premiumTrialEndsAt: v.optional(v.number()),
    usageMonth: v.optional(v.string()),
    usageDay: v.optional(v.string()),
    messagesUsedThisMonth: v.optional(v.number()),
    profileViewsUsedThisMonth: v.optional(v.number()),
    likesUsedToday: v.optional(v.number()),
    lastActive: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_completed", ["completed"]),
  preferences: defineTable({
    userId: v.string(),
    preferredGender: v.optional(v.string()),
    minAge: v.number(),
    maxAge: v.number(),
    preferredRegions: v.array(v.string()),
    preferredLanguages: v.array(v.string()),
    preferredTribes: v.array(v.string()),
    tribeImportance: v.string(),
    preferredRelationshipGoal: v.optional(v.string()),
    preferredHobbies: v.array(v.string()),
    openToLongDistance: v.boolean(),
  }).index("by_user", ["userId"]),
  likes: defineTable({
    fromProfileId: v.id("profiles"),
    toProfileId: v.id("profiles"),
  })
    .index("by_from", ["fromProfileId"])
    .index("by_to", ["toProfileId"])
    .index("by_pair", ["fromProfileId", "toProfileId"]),
  conversations: defineTable({
    userA: v.id("profiles"),
    userB: v.id("profiles"),
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_a", ["userA"])
    .index("by_b", ["userB"])
    .index("by_pair", ["userA", "userB"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderProfileId: v.id("profiles"),
    body: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId", "createdAt"]),
  notifications: defineTable({
    recipientProfileId: v.id("profiles"),
    actorProfileId: v.id("profiles"),
    type: v.union(v.literal("like"), v.literal("match"), v.literal("message")),
    conversationId: v.optional(v.id("conversations")),
    messagePreview: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_recipient", ["recipientProfileId", "createdAt"]),
  reports: defineTable({
    reporterProfileId: v.id("profiles"),
    reportedProfileId: v.id("profiles"),
    reason: v.union(
      v.literal("fake_profile"),
      v.literal("harassment"),
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_reported", ["reportedProfileId", "createdAt"])
    .index("by_reporter", ["reporterProfileId", "createdAt"]),
  adminAudit: defineTable({
    adminUserId: v.string(),
    action: v.string(),
    targetProfileId: v.optional(v.id("profiles")),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
