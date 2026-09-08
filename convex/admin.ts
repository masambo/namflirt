import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAdminIdentity, requireAdmin } from "./authHelpers";
import { normalizePlan } from "./plans";

const memberStatus = v.union(v.literal("active"), v.literal("suspended"));
const reportStatus = v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed"));
const plan = v.union(v.literal("free"), v.literal("premium"), v.literal("vip"));

function publicStatus(profile: Doc<"profiles">) {
  return profile.status ?? "active";
}

function profileSummary(profile: Doc<"profiles">, reportCount = 0) {
  return {
    _id: profile._id,
    _creationTime: profile._creationTime,
    displayName: profile.displayName,
    email: profile.email,
    photo: profile.photos[0],
    town: profile.town,
    region: profile.region,
    completed: profile.completed,
    verified: profile.verified,
    isDemo: profile.isDemo,
    plan: normalizePlan(profile.plan),
    status: publicStatus(profile),
    moderationNote: profile.moderationNote,
    lastActive: profile.lastActive,
    reportCount,
  };
}

export const access = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminIdentity(ctx);
    return { isAdmin: Boolean(admin), email: admin?.email };
  },
});

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [profiles, likes, conversations, messages, reports] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("likes").collect(),
      ctx.db.query("conversations").collect(),
      ctx.db.query("messages").collect(),
      ctx.db.query("reports").collect(),
    ]);

    const now = Date.now();
    const realProfiles = profiles.filter(
      (profile) => !profile.isDemo && profile.status !== "deleted",
    );
    const pairKeys = new Set(
      likes.map((like) => `${String(like.fromProfileId)}:${String(like.toProfileId)}`),
    );
    const mutualMatches =
      likes.filter((like) =>
        pairKeys.has(`${String(like.toProfileId)}:${String(like.fromProfileId)}`),
      ).length / 2;
    const activity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now - (6 - index) * 86_400_000);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        members: realProfiles.filter(
          (profile) => new Date(profile._creationTime).toISOString().slice(0, 10) === key,
        ).length,
        messages: messages.filter(
          (message) => new Date(message.createdAt).toISOString().slice(0, 10) === key,
        ).length,
      };
    });
    const reportCounts = new Map<string, number>();
    for (const report of reports) {
      const key = String(report.reportedProfileId);
      reportCounts.set(key, (reportCounts.get(key) ?? 0) + 1);
    }

    return {
      metrics: {
        members: realProfiles.length,
        completed: realProfiles.filter((profile) => profile.completed).length,
        newThisWeek: realProfiles.filter((profile) => profile._creationTime >= now - 604_800_000)
          .length,
        activeNow: realProfiles.filter((profile) => profile.lastActive >= now - 900_000).length,
        activeToday: realProfiles.filter((profile) => profile.lastActive >= now - 86_400_000)
          .length,
        mutualMatches,
        conversations: conversations.length,
        messages: messages.length,
        openReports: reports.filter((report) => report.status === "open").length,
        suspended: realProfiles.filter((profile) => publicStatus(profile) === "suspended").length,
        verified: realProfiles.filter((profile) => profile.verified).length,
        demoProfiles: profiles.filter((profile) => profile.isDemo).length,
      },
      plans: {
        free: realProfiles.filter((profile) => normalizePlan(profile.plan) === "free").length,
        premium: realProfiles.filter((profile) => normalizePlan(profile.plan) === "premium").length,
        vip: realProfiles.filter((profile) => normalizePlan(profile.plan) === "vip").length,
      },
      activity,
      recentMembers: realProfiles
        .toSorted((a, b) => b._creationTime - a._creationTime)
        .slice(0, 6)
        .map((profile) => profileSummary(profile, reportCounts.get(String(profile._id)) ?? 0)),
    };
  },
});

export const members = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("all"), memberStatus)),
    plan: v.optional(v.union(v.literal("all"), plan)),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [profiles, reports] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("reports").collect(),
    ]);
    const reportCounts = new Map<string, number>();
    for (const report of reports) {
      const key = String(report.reportedProfileId);
      reportCounts.set(key, (reportCounts.get(key) ?? 0) + 1);
    }
    const search = args.search?.trim().toLowerCase() ?? "";
    return profiles
      .filter((profile) => !profile.isDemo && profile.status !== "deleted")
      .filter((profile) => {
        if (!search) return true;
        return `${profile.displayName} ${profile.email ?? ""} ${profile.town ?? ""}`
          .toLowerCase()
          .includes(search);
      })
      .filter(
        (profile) => !args.status || args.status === "all" || publicStatus(profile) === args.status,
      )
      .filter(
        (profile) => !args.plan || args.plan === "all" || normalizePlan(profile.plan) === args.plan,
      )
      .toSorted((a, b) => b._creationTime - a._creationTime)
      .slice(0, 200)
      .map((profile) => profileSummary(profile, reportCounts.get(String(profile._id)) ?? 0));
  },
});

export const reports = query({
  args: { status: v.optional(v.union(v.literal("all"), reportStatus)) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const reports = await ctx.db.query("reports").collect();
    return Promise.all(
      reports
        .filter((report) => !status || status === "all" || report.status === status)
        .toSorted((a, b) => b.createdAt - a.createdAt)
        .slice(0, 200)
        .map(async (report) => ({
          ...report,
          reporter: profileSummary((await ctx.db.get(report.reporterProfileId)) as Doc<"profiles">),
          reported: profileSummary((await ctx.db.get(report.reportedProfileId)) as Doc<"profiles">),
        })),
    );
  },
});

async function audit(
  ctx: MutationCtx,
  adminUserId: string,
  action: string,
  targetProfileId?: Id<"profiles">,
  details?: string,
) {
  await ctx.db.insert("adminAudit", {
    adminUserId,
    action,
    targetProfileId,
    details,
    createdAt: Date.now(),
  });
}

export const setMemberStatus = mutation({
  args: { profileId: v.id("profiles"), status: memberStatus, note: v.optional(v.string()) },
  handler: async (ctx, { profileId, status, note }) => {
    const admin = await requireAdmin(ctx);
    const profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Member not found.");
    if (profile.status === "deleted") throw new Error("This profile has been deleted.");
    if (profile.userId === admin.userId && status === "suspended") {
      throw new Error("You cannot suspend your own account.");
    }
    const cleanNote = note?.trim().slice(0, 300);
    await ctx.db.patch(profileId, {
      status,
      moderationNote: cleanNote || undefined,
    });
    await audit(
      ctx,
      admin.userId,
      status === "suspended" ? "member_suspended" : "member_restored",
      profileId,
      cleanNote,
    );
    return { status };
  },
});

export const setVerified = mutation({
  args: { profileId: v.id("profiles"), verified: v.boolean() },
  handler: async (ctx, { profileId, verified }) => {
    const admin = await requireAdmin(ctx);
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.status === "deleted") throw new Error("Member not found.");
    await ctx.db.patch(profileId, { verified });
    await audit(
      ctx,
      admin.userId,
      verified ? "member_verified" : "verification_removed",
      profileId,
    );
    return { verified };
  },
});

export const setPlan = mutation({
  args: { profileId: v.id("profiles"), plan },
  handler: async (ctx, { profileId, plan }) => {
    const admin = await requireAdmin(ctx);
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.status === "deleted") throw new Error("Member not found.");
    await ctx.db.patch(profileId, { plan });
    await audit(ctx, admin.userId, "plan_changed", profileId, plan);
    return { plan };
  },
});

export const deleteProfile = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const admin = await requireAdmin(ctx);
    const profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Member not found.");
    if (profile.userId === admin.userId)
      throw new Error("You cannot delete your own admin profile.");
    if (profile.status === "deleted") return;
    await ctx.db.patch(profileId, { status: "deleted", completed: false });
    await audit(ctx, admin.userId, "profile_deleted", profileId);
  },
});

export const resolveReport = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(v.literal("resolved"), v.literal("dismissed")),
  },
  handler: async (ctx, { reportId, status }) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found.");
    await ctx.db.patch(reportId, { status, resolvedAt: Date.now(), resolvedBy: admin.email });
    await audit(ctx, admin.userId, `report_${status}`, report.reportedProfileId, String(reportId));
    return { status };
  },
});
