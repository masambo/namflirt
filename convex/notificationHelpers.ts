import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export async function createNotification(
  ctx: MutationCtx,
  notification: {
    recipientProfileId: Id<"profiles">;
    actorProfileId: Id<"profiles">;
    type: "like" | "match" | "message";
    conversationId?: Id<"conversations">;
    messagePreview?: string;
  },
) {
  await ctx.db.insert("notifications", {
    ...notification,
    read: false,
    createdAt: Date.now(),
  });
}
