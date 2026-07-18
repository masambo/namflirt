import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getClerkUserId, isConfiguredAdmin, requireClerkUserId } from "./authHelpers";
import { currentUsageDay, currentUsageMonth, normalizePlan, planLimits } from "./plans";

const PREMIUM_TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

const demoProfiles = [
  {
    displayName: "Ndemona",
    dateOfBirth: "1998-03-18",
    gender: "female",
    region: "Khomas",
    town: "Windhoek",
    tribe: "Aawambo",
    bio: "Architect by day, sunset chaser by instinct. I like honest conversations, tiny cafés and weekends that turn into stories.",
    languages: ["English", "Oshiwambo"],
    hobbies: ["Art", "Hiking", "Traveling"],
    lifestyle: ["Doesn't smoke"],
    relationshipGoal: "serious",
    religion: "Christian",
    education: "Degree",
    occupation: "Architect",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=88",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=86",
    ],
  },
  {
    displayName: "Tuli",
    dateOfBirth: "1996-08-07",
    gender: "male",
    region: "Erongo",
    town: "Swakopmund",
    tribe: "Herero",
    bio: "Ocean mornings, good coffee, live music. Building a life I don't need a holiday from — looking for someone warm and curious.",
    languages: ["English", "Otjiherero", "Afrikaans"],
    hobbies: ["Music", "Gym", "Cooking"],
    lifestyle: ["Doesn't smoke"],
    relationshipGoal: "serious",
    religion: "Christian",
    education: "Degree",
    occupation: "Product designer",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&q=88",
      "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=900&q=86",
    ],
  },
  {
    displayName: "Amalia",
    dateOfBirth: "2000-01-22",
    gender: "female",
    region: "Oshana",
    town: "Ongwediva",
    tribe: "Aawambo",
    bio: "A soft heart with a loud laugh. Sundays are for family, playlists and trying one more recipe than necessary.",
    languages: ["English", "Oshiwambo"],
    hobbies: ["Cooking", "Dancing", "Music"],
    lifestyle: ["Doesn't drink"],
    relationshipGoal: "marriage",
    religion: "Christian",
    education: "Diploma",
    occupation: "Marketing",
    verified: false,
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=88",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&q=86",
    ],
  },
  {
    displayName: "Ruben",
    dateOfBirth: "1995-11-03",
    gender: "male",
    region: "Khomas",
    town: "Windhoek",
    tribe: "Damara",
    bio: "Photographer, road-trip planner and committed braai optimist. Here for something grounded, playful and mutual.",
    languages: ["English", "Afrikaans", "Khoekhoegowab"],
    hobbies: ["Art", "Traveling", "Football"],
    lifestyle: ["No children"],
    relationshipGoal: "serious",
    religion: "Spiritual",
    education: "Diploma",
    occupation: "Photographer",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&q=88",
      "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=900&q=86",
    ],
  },
  {
    displayName: "Selma",
    dateOfBirth: "1997-05-14",
    gender: "female",
    region: "Zambezi",
    town: "Katima Mulilo",
    tribe: "Zambezi",
    bio: "I care about community, quiet confidence and people who mean what they say. Bonus points for a very good road-trip playlist.",
    languages: ["English", "Silozi"],
    hobbies: ["Volunteering", "Reading", "Traveling"],
    lifestyle: ["Doesn't smoke"],
    relationshipGoal: "marriage",
    religion: "Christian",
    education: "Postgraduate",
    occupation: "Researcher",
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=1200&q=88",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&q=86",
    ],
  },
  {
    displayName: "Jerome",
    dateOfBirth: "1999-09-30",
    gender: "male",
    region: "Otjozondjupa",
    town: "Otjiwarongo",
    tribe: "Herero",
    bio: "Engineer with farmer roots. Gym after work, football on weekends, and always time for the people who matter.",
    languages: ["English", "Otjiherero"],
    hobbies: ["Gym", "Football", "Farming"],
    lifestyle: ["Wants children"],
    relationshipGoal: "serious",
    religion: "Christian",
    education: "Degree",
    occupation: "Engineer",
    verified: false,
    photos: [
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=1200&q=88",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900&q=86",
    ],
  },
] as const;

async function requireUser(ctx: MutationCtx) {
  return requireClerkUserId(ctx);
}

function withPlanDefaults<
  T extends {
    plan?: string;
    usageMonth?: string;
    usageDay?: string;
    messagesUsedThisMonth?: number;
    profileViewsUsedThisMonth?: number;
    likesUsedToday?: number;
    premiumTrialEndsAt?: number;
  },
>(profile: T) {
  return {
    ...profile,
    plan: normalizePlan(profile.plan),
    usageMonth: profile.usageMonth ?? currentUsageMonth(),
    usageDay: profile.usageDay ?? currentUsageDay(),
    messagesUsedThisMonth: profile.messagesUsedThisMonth ?? 0,
    profileViewsUsedThisMonth: profile.profileViewsUsedThisMonth ?? 0,
    likesUsedToday: profile.likesUsedToday ?? 0,
    premiumTrialEndsAt: profile.premiumTrialEndsAt,
  };
}

function isAdminProfile(profile: { userId?: string; email?: string }) {
  return isConfiguredAdmin(profile.userId, profile.email);
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;
    const preferences = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return { ...withPlanDefaults(profile), preferences };
  },
});

export const ensureViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You need to sign in first.");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email,
        lastActive: Date.now(),
      });
      return existing._id;
    }

    const fallbackName = identity.email?.split("@")[0] ?? "New member";
    const displayName = (identity.name ?? identity.givenName ?? fallbackName).trim().slice(0, 60);

    return ctx.db.insert("profiles", {
      userId: identity.subject,
      email: identity.email,
      displayName: displayName || "New member",
      languages: [],
      hobbies: [],
      lifestyle: [],
      photos: identity.pictureUrl ? [identity.pictureUrl] : [],
      verified: false,
      completed: false,
      isDemo: false,
      plan: "premium",
      premiumTrialEndsAt: Date.now() + PREMIUM_TRIAL_MS,
      usageMonth: currentUsageMonth(),
      usageDay: currentUsageDay(),
      messagesUsedThisMonth: 0,
      profileViewsUsedThisMonth: 0,
      likesUsedToday: 0,
      lastActive: Date.now(),
    });
  },
});

export const touchActive = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return;
    await ctx.db.patch(profile._id, { lastActive: Date.now() });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getClerkUserId(ctx);
    if (!userId) throw new Error("You need to sign in first.");
    const viewer = userId
      ? await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique()
      : null;
    const preferences = userId
      ? await ctx.db
          .query("preferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique()
      : null;
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_completed", (q) => q.eq("completed", true))
      .collect();
    const [sentLikes, receivedLikes] = viewer
      ? await Promise.all([
          ctx.db
            .query("likes")
            .withIndex("by_from", (q) => q.eq("fromProfileId", viewer._id))
            .collect(),
          ctx.db
            .query("likes")
            .withIndex("by_to", (q) => q.eq("toProfileId", viewer._id))
            .collect(),
        ])
      : [[], []];
    const receivedFrom = new Set(receivedLikes.map((like) => like.fromProfileId));
    const matchedProfileIds = new Set(
      sentLikes
        .filter((like) => receivedFrom.has(like.toProfileId))
        .map((like) => like.toProfileId),
    );
    return {
      viewer: viewer ? withPlanDefaults(viewer) : null,
      preferences,
      profiles: profiles.filter(
        (profile) =>
          profile._id !== viewer?._id &&
          profile.status !== "suspended" &&
          !isAdminProfile(profile) &&
          !matchedProfileIds.has(profile._id),
      ),
    };
  },
});

export const get = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const viewerUserId = await getClerkUserId(ctx);
    if (!viewerUserId) throw new Error("You need to sign in first.");
    const profile = await ctx.db.get(profileId);
    const viewerIsAdmin = isConfiguredAdmin(viewerUserId);
    if (
      !profile ||
      profile.status === "suspended" ||
      (isAdminProfile(profile) && profile.userId !== viewerUserId && !viewerIsAdmin)
    )
      return null;
    return profile;
  },
});

export const save = mutation({
  args: {
    displayName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    bio: v.string(),
    region: v.string(),
    town: v.string(),
    tribe: v.string(),
    languages: v.array(v.string()),
    hobbies: v.array(v.string()),
    lifestyle: v.array(v.string()),
    relationshipGoal: v.string(),
    religion: v.string(),
    education: v.string(),
    occupation: v.string(),
    preferredGender: v.string(),
    minAge: v.number(),
    maxAge: v.number(),
    preferredRegions: v.array(v.string()),
    preferredLanguages: v.array(v.string()),
    preferredTribes: v.array(v.string()),
    tribeImportance: v.string(),
    preferredRelationshipGoal: v.string(),
    preferredHobbies: v.array(v.string()),
    openToLongDistance: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const age = Math.floor((Date.now() - new Date(args.dateOfBirth).getTime()) / 31_557_600_000);
    if (!Number.isFinite(age) || age < 18)
      throw new Error("NamFlirt is for adults aged 18 and over.");
    if (args.displayName.trim().length < 2 || args.bio.trim().length < 30)
      throw new Error("Add a real name and a little more about yourself.");
    if (
      !args.gender ||
      !args.region ||
      !args.town.trim() ||
      !args.relationshipGoal ||
      !args.preferredGender
    )
      throw new Error("Complete every required profile and matching field.");
    if (!args.languages.length || !args.hobbies.length)
      throw new Error("Choose at least one language and interest.");
    if (args.minAge < 18 || args.maxAge > 100 || args.minAge > args.maxAge)
      throw new Error("Check your preferred age range.");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const profile = {
      userId,
      displayName: args.displayName.trim().slice(0, 60),
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      bio: args.bio.trim().slice(0, 600),
      region: args.region,
      town: args.town.trim().slice(0, 80),
      tribe: args.tribe,
      languages: args.languages,
      hobbies: args.hobbies,
      lifestyle: args.lifestyle,
      relationshipGoal: args.relationshipGoal,
      religion: args.religion,
      education: args.education,
      occupation: args.occupation,
      photos: existing?.photos ?? [],
      verified: existing?.verified ?? false,
      completed: true,
      isDemo: false,
      lastActive: Date.now(),
      plan: existing?.plan ?? "premium",
      premiumTrialEndsAt: existing?.premiumTrialEndsAt ?? Date.now() + PREMIUM_TRIAL_MS,
      usageMonth: existing?.usageMonth ?? currentUsageMonth(),
      usageDay: existing?.usageDay ?? currentUsageDay(),
      messagesUsedThisMonth: existing?.messagesUsedThisMonth ?? 0,
      profileViewsUsedThisMonth: existing?.profileViewsUsedThisMonth ?? 0,
      likesUsedToday: existing?.likesUsedToday ?? 0,
    };
    const profileId = existing
      ? (await ctx.db.patch(existing._id, profile), existing._id)
      : await ctx.db.insert("profiles", profile);
    const pref = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const preferences = {
      userId,
      preferredGender: args.preferredGender,
      minAge: args.minAge,
      maxAge: args.maxAge,
      preferredRegions: args.preferredRegions,
      preferredLanguages: args.preferredLanguages,
      preferredTribes: args.preferredTribes,
      tribeImportance: args.tribeImportance,
      preferredRelationshipGoal: args.preferredRelationshipGoal,
      preferredHobbies: args.preferredHobbies,
      openToLongDistance: args.openToLongDistance,
    };
    if (pref) await ctx.db.patch(pref._id, preferences);
    else await ctx.db.insert("preferences", preferences);
    const demos = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .take(1);
    if (!demos.length) {
      for (const [index, demo] of demoProfiles.entries())
        await ctx.db.insert("profiles", {
          ...demo,
          languages: [...demo.languages],
          hobbies: [...demo.hobbies],
          lifestyle: [...demo.lifestyle],
          photos: [...demo.photos],
          completed: true,
          isDemo: true,
          lastActive: Date.now() - index * 120_000,
        });
    }
    return profileId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const choosePlan = mutation({
  args: { plan: v.union(v.literal("free"), v.literal("premium"), v.literal("vip")) },
  handler: async () => {
    throw new Error("New members receive Premium for 14 days.");
  },
});

export const viewProfile = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const userId = await requireUser(ctx);
    const viewer = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!viewer) return { status: "profile_required" as const };
    const profile = await ctx.db.get(profileId);
    if (!profile || !profile.completed || profile.status === "suspended")
      return { status: "not_found" as const };
    if (viewer._id === profileId) {
      return { status: "ready" as const, profile: withPlanDefaults(profile) };
    }
    if (isAdminProfile(profile) && !isAdminProfile(viewer)) {
      return { status: "not_found" as const };
    }

    const month = currentUsageMonth();
    const plan = normalizePlan(viewer.plan);
    const used = viewer.usageMonth === month ? (viewer.profileViewsUsedThisMonth ?? 0) : 0;
    const limit = planLimits[plan].profileViewsPerMonth;
    if (limit !== null && used >= limit) {
      return { status: "plan_limit" as const, plan, limit };
    }
    await ctx.db.patch(viewer._id, {
      usageMonth: month,
      profileViewsUsedThisMonth: used + 1,
      messagesUsedThisMonth: viewer.usageMonth === month ? (viewer.messagesUsedThisMonth ?? 0) : 0,
    });
    return { status: "ready" as const, profile: withPlanDefaults(profile) };
  },
});

export const addPhoto = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Complete your profile before adding photos.");
    if (profile.photos.length >= 6) throw new Error("You can add up to 6 photos.");
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Upload could not be resolved.");
    await ctx.db.patch(profile._id, { photos: [...profile.photos, url] });
    return url;
  },
});
