import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { isPlaceholderName, nameFromEmail } from "../shared/profileName";

export const backfillBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("profiles").paginate({ numItems: 100, cursor });
    let updated = 0;
    let placeholders = 0;
    let placeholdersWithEmail = 0;
    for (const profile of page.page) {
      if (!isPlaceholderName(profile.displayName)) continue;
      placeholders += 1;
      if (profile.email) placeholdersWithEmail += 1;
      const displayName = nameFromEmail(profile.email);
      if (displayName) {
        await ctx.db.patch(profile._id, { displayName });
        updated += 1;
      }
    }
    return {
      cursor: page.continueCursor,
      done: page.isDone,
      updated,
      placeholders,
      placeholdersWithEmail,
    };
  },
});

export const backfillPlaceholderNames = internalAction({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let updated = 0;
    let placeholders = 0;
    let placeholdersWithEmail = 0;
    while (true) {
      const batch: {
        cursor: string | null;
        done: boolean;
        updated: number;
        placeholders: number;
        placeholdersWithEmail: number;
      } = await ctx.runMutation(internal.profileMigrations.backfillBatch, { cursor });
      updated += batch.updated;
      placeholders += batch.placeholders;
      placeholdersWithEmail += batch.placeholdersWithEmail;
      if (batch.done) return { updated, placeholders, placeholdersWithEmail };
      cursor = batch.cursor;
    }
  },
});
