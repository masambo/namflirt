import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

export const sendActivityEmail = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    actorName: v.string(),
    actorProfileId: v.optional(v.id("profiles")),
    actorPhotoUrl: v.optional(v.string()),
    actorBio: v.optional(v.string()),
    event: v.union(v.literal("like"), v.literal("match"), v.literal("message")),
    retryCount: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { to, recipientName, actorName, actorProfileId, actorPhotoUrl, actorBio, event, retryCount = 0 },
  ) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.warn("Email delivery is disabled: configure RESEND_API_KEY and RESEND_FROM_EMAIL.");
      return;
    }

    const appUrl = (process.env.NAMFLIRT_APP_URL || "https://app.namflirt.com").replace(/\/$/, "");
    const subject =
      event === "match"
        ? "You have a new match on namflirt."
        : event === "like"
          ? `${actorName} liked your profile on namflirt.`
          : "You have a new message on namflirt.";
    const heading =
      event === "match"
        ? "It's a match!"
        : event === "like"
          ? "Someone likes you."
          : "A new message is waiting.";
    const description =
      event === "match"
        ? `You and ${actorName} liked each other.`
        : event === "like"
          ? `${actorName} liked your profile. Here's a little introduction.`
          : `${actorName} sent you a message. Sign in to read it.`;
    const href = `${appUrl}${actorProfileId ? `/profile/${actorProfileId}` : event === "match" ? "/likes" : "/messages"}`;
    const safeName = escapeHtml(recipientName);
    const safeDescription = escapeHtml(description);
    const safeActorName = escapeHtml(actorName);
    const safeActorBio = escapeHtml(actorBio ?? "");
    const photo =
      actorPhotoUrl && /^https:\/\//i.test(actorPhotoUrl)
        ? `<img src="${escapeHtml(actorPhotoUrl)}" alt="${safeActorName}" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin:0 0 18px" />`
        : "";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: `
          <div style="margin:0;background:#11110f;padding:40px 16px;color:#fff;font-family:Arial,sans-serif">
            <div style="max-width:520px;margin:0 auto;padding:32px;border:1px solid #ffffff20;border-radius:18px;background:#191917">
              <p style="margin:0 0 20px;color:#ff4f87;font-size:14px;font-weight:bold">namflirt.</p>
              <p style="margin:0 0 8px;color:#ffffff70;font-size:13px">Hi ${safeName},</p>
              <h1 style="margin:0 0 12px;font-size:26px">${heading}</h1>
              <p style="margin:0 0 26px;color:#ffffffb0;line-height:1.6">${safeDescription}</p>
              ${event === "like" || event === "match" ? `${photo}<p style="margin:0 0 8px;font-size:18px;font-weight:bold">${safeActorName}</p>${safeActorBio ? `<p style="margin:0 0 24px;color:#ffffff90;line-height:1.6">${safeActorBio}</p>` : ""}` : ""}
              <a href="${href}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#ff4f87;color:#fff;font-weight:bold;text-decoration:none">Open namflirt.</a>
              <p style="margin:28px 0 0;color:#ffffff60;font-size:12px;line-height:1.6">Turn off activity emails in your namflirt. profile settings.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error(`Resend email failed with HTTP ${response.status}: ${await response.text()}`);
      if (response.status === 429 && retryCount < 5) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Math.max(1000, retryAfter * 1000) + Math.floor(Math.random() * 15000);
        await ctx.scheduler.runAfter(delay, internal.emails.sendActivityEmail, {
          to,
          recipientName,
          actorName,
          actorProfileId,
          actorPhotoUrl,
          actorBio,
          event,
          retryCount: retryCount + 1,
        });
      }
    }
  },
});
