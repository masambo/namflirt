import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";

// Resolve Convex's extensionless imports when running its handlers in Node.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith(".")) throw error;
      for (const extension of [".ts", ".js"]) {
        try {
          return nextResolve(specifier + extension, context);
        } catch {}
      }
      throw error;
    }
  },
});

const admin = await import("../convex/admin.ts");
const profiles = await import("../convex/profiles.ts");
const conversations = await import("../convex/conversations.ts");
const likes = await import("../convex/likes.ts");
const notifications = await import("../convex/notifications.ts");
process.env.ADMIN_USER_IDS = "admin-user";
process.env.ADMIN_EMAILS = "";

function fixture(userId = "admin-user") {
  const member = {
    _id: "member",
    userId: "member-user",
    status: "active",
    completed: true,
    photos: ["photo"],
    displayName: "Member",
  };
  const other = { _id: "other", userId: "other-user", completed: true, photos: ["other-photo"] };
  const tables = {
    profiles: [member, other],
    adminAudit: [],
    preferences: [],
    conversations: [{ _id: "chat", userA: "other", userB: "member" }],
    messages: [
      { _id: "message", conversationId: "chat", senderProfileId: "member", body: "Hello" },
    ],
    likes: [{ _id: "like", fromProfileId: "member", toProfileId: "other" }],
    notifications: [
      { _id: "notice", recipientProfileId: "other", actorProfileId: "member", read: false },
    ],
  };
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: userId }) },
    db: {
      get: async (id) =>
        Object.values(tables)
          .flat()
          .find((row) => row._id === id) ?? null,
      patch: async (id, values) => Object.assign(await ctx.db.get(id), values),
      insert: async (table, values) => {
        tables[table].push(values);
        return "inserted";
      },
      query(table) {
        let rows = [...tables[table]];
        const query = {
          withIndex(name, predicate) {
            const index = {
              eq(field, value) {
                rows = rows.filter((row) => row[field] === value);
                return index;
              },
            };
            predicate(index);
            return query;
          },
          order: () => query,
          filter(predicate) {
            const matches = predicate({
              field: (name) => name,
              eq: (field, value) => (row) => row[field] === value,
            });
            rows = rows.filter(matches);
            return query;
          },
          unique: async () => rows[0] ?? null,
          collect: async () => rows,
          take: async (count) => rows.slice(0, count),
        };
        return query;
      },
    },
  };
  return { ctx, tables, member };
}

const validProfile = {
  displayName: "Member",
  dateOfBirth: "1995-01-01",
  gender: "male",
  bio: "I enjoy spending time outside and meeting new people.",
  country: "NA",
  region: "Khomas",
  town: "Windhoek",
  tribe: "",
  languages: ["English"],
  hobbies: ["Music"],
  lifestyle: [],
  relationshipGoal: "serious",
  religion: "",
  education: "",
  occupation: "",
  preferredGender: "female",
  minAge: 18,
  maxAge: 50,
  preferredRegions: [],
  preferredLanguages: [],
  preferredTribes: [],
  tribeImportance: "open_to_all",
  preferredRelationshipGoal: "serious",
  preferredHobbies: [],
  openToLongDistance: true,
};

test("photo edits cannot remove the final photo without a replacement", async () => {
  const { ctx, member } = fixture("member-user");
  await assert.rejects(
    profiles.save._handler(ctx, { ...validProfile, removedPhotos: ["photo"] }),
    /at least one photo/,
  );
  assert.deepEqual(member.photos, ["photo"]);
});

test("photo edits replace the last photo and preserve other members' photos", async () => {
  const { ctx, member, tables } = fixture("member-user");
  ctx.storage = { getUrl: async () => "replacement" };
  await profiles.save._handler(ctx, {
    ...validProfile,
    removedPhotos: ["photo", "other-photo"],
    photoStorageIds: ["upload"],
  });
  assert.deepEqual(member.photos, ["replacement"]);
  assert.deepEqual(tables.profiles.find((profile) => profile._id === "other").photos, [
    "other-photo",
  ]);
});

test("photo replacement works at the six-photo limit", async () => {
  const { ctx, member } = fixture("member-user");
  member.photos = ["a", "b", "c", "d", "e", "f"];
  ctx.storage = { getUrl: async () => "replacement" };
  await profiles.save._handler(ctx, {
    ...validProfile,
    removedPhotos: ["a"],
    photoStorageIds: ["upload"],
  });
  assert.deepEqual(member.photos, ["b", "c", "d", "e", "f", "replacement"]);
});

test("failed uploads and excess photos leave saved photos unchanged", async () => {
  const { ctx, member } = fixture("member-user");
  ctx.storage = { getUrl: async () => null };
  await assert.rejects(
    profiles.save._handler(ctx, {
      ...validProfile,
      removedPhotos: ["photo"],
      photoStorageIds: ["missing"],
    }),
    /could not be resolved/,
  );
  assert.deepEqual(member.photos, ["photo"]);
  member.photos = ["a", "b", "c", "d", "e", "f"];
  ctx.storage.getUrl = async () => "extra";
  await assert.rejects(
    profiles.save._handler(ctx, { ...validProfile, photoStorageIds: ["upload"] }),
    /up to 6 photos/,
  );
  assert.equal(member.photos.length, 6);
});

test("only admins can delete profiles, and cannot delete themselves", async () => {
  const { ctx, member } = fixture("member-user");
  await assert.rejects(admin.deleteProfile._handler(ctx, { profileId: "member" }), /permission/);
  assert.equal(member.status, "active");
  member.userId = "admin-user";
  ctx.auth.getUserIdentity = async () => ({ subject: "admin-user" });
  await assert.rejects(
    admin.deleteProfile._handler(ctx, { profileId: "member" }),
    /own admin profile/,
  );
});

test("deletion records an audit and cannot be reversed by restore or sign-in", async () => {
  const { ctx, member, tables } = fixture();
  await admin.deleteProfile._handler(ctx, { profileId: "member" });
  assert.equal(member.status, "deleted");
  assert.equal(member.completed, false);
  assert.equal(tables.adminAudit[0].action, "profile_deleted");
  await assert.rejects(
    admin.setMemberStatus._handler(ctx, { profileId: "member", status: "active" }),
    /deleted/,
  );
  ctx.auth.getUserIdentity = async () => ({ subject: "member-user" });
  await profiles.ensureViewer._handler(ctx, {});
  assert.equal(member.status, "deleted");
  await assert.rejects(profiles.save._handler(ctx, {}), /not available/);
  await assert.rejects(profiles.generateUploadUrl._handler(ctx, {}), /not available/);
});

test("deleted profiles disappear from direct links, likes, conversations, and notifications", async () => {
  const { ctx, member } = fixture("other-user");
  assert.equal((await conversations.list._handler(ctx, {})).length, 1);
  assert.equal((await likes.summary._handler(ctx, {})).received.length, 1);
  member.status = "deleted";
  assert.equal(await profiles.get._handler(ctx, { profileId: "member" }), null);
  assert.deepEqual(await conversations.list._handler(ctx, {}), []);
  assert.equal(await conversations.detail._handler(ctx, { conversationId: "chat" }), null);
  assert.deepEqual((await likes.summary._handler(ctx, {})).received, []);
  assert.deepEqual(await notifications.list._handler(ctx, {}), { items: [], unreadCount: 0 });
  assert.deepEqual(
    await conversations.send._handler(ctx, { conversationId: "chat", body: "Hello" }),
    { status: "not_found" },
  );
  await assert.rejects(likes.toggle._handler(ctx, { profileId: "member" }), /not available/);
});

test("a deleted member cannot read conversations or send likes", async () => {
  const { ctx, member } = fixture("member-user");
  member.status = "deleted";
  assert.deepEqual(await conversations.list._handler(ctx, {}), []);
  assert.equal(await conversations.detail._handler(ctx, { conversationId: "chat" }), null);
  await assert.rejects(likes.toggle._handler(ctx, { profileId: "other" }), /not available/);
});
