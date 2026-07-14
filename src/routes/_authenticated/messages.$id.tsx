import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, CheckCheck, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { isOnline, presenceLabel } from "@/lib/presence";
import type { Message, Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: ConversationView,
});

interface Detail {
  other: Profile | null;
  messages: Message[];
  viewerProfileId: string;
  canSeeReadReceipts: boolean;
}

type SendMessageResult =
  | { status: "sent"; messageId: string }
  | { status: "plan_limit"; plan: string; limit: number }
  | { status: "not_found" }
  | { status: "empty" };

function ConversationView() {
  const { id } = Route.useParams();
  const detail = useQuery(api.conversations.detail, { conversationId: id }) as
    Detail | null | undefined;
  const sendMessage = useMutation(api.conversations.send);
  const markRead = useMutation(api.conversations.markRead);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = detail?.messages.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messageCount === undefined) return;
    function markVisibleMessagesRead() {
      if (document.visibilityState === "visible") {
        void markRead({ conversationId: id });
      }
    }
    markVisibleMessagesRead();
    document.addEventListener("visibilitychange", markVisibleMessagesRead);
    return () => document.removeEventListener("visibilitychange", markVisibleMessagesRead);
  }, [id, markRead, messageCount]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setText("");
    try {
      const result = (await sendMessage({ conversationId: id, body })) as SendMessageResult;
      if (result.status === "sent") return;
      setText(body);
      if (result.status === "plan_limit") {
        toast.info("Monthly message limit reached", {
          description: "Premium trial access is available while payment setup is being completed.",
        });
        return;
      }
      toast.error("Message not sent", {
        description:
          result.status === "not_found"
            ? "This conversation is no longer available."
            : "Write a message before sending.",
      });
    } catch {
      setText(body);
      toast.error("Message not sent", {
        description: "Your message is still here. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!detail)
    return (
      <div className="grid h-[70vh] place-items-center text-sm text-white/30">
        Loading conversation…
      </div>
    );
  const other = detail.other;
  const otherOnline = isOnline(other?.lastActive, now);
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#181816] md:h-[calc(100vh-10rem)]">
      <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
        <Link to="/messages" className="icon-button md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link
          to="/profile/$id"
          params={{ id: other?._id ?? "" }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="h-11 w-11 overflow-hidden rounded-full bg-white/5">
            {other?.photos[0] ? (
              <img src={other.photos[0]} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold tracking-[-.025em]">{other?.displayName}</h1>
            <p
              className={`mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold ${
                otherOnline ? "text-[#55d89a]" : "text-white/35"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${otherOnline ? "bg-[#55d89a]" : "bg-white/20"}`}
              />
              {presenceLabel(other?.lastActive, now)}
            </p>
          </div>
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto mb-8 max-w-xs text-center">
          <Sparkles className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-3 text-xs leading-relaxed text-white/30">
            You matched because something aligned. Stay curious, respectful and real.
          </p>
        </div>
        <div className="space-y-2.5">
          {detail.messages.map((message) => {
            const mine = message.senderProfileId === detail.viewerProfileId;
            return (
              <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed ${mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-white/[.07] text-white/80"}`}
                >
                  <p>{message.body}</p>
                  <span
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${mine ? "text-white/58" : "text-white/25"}`}
                  >
                    <time>
                      {new Intl.DateTimeFormat("en", {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(message.createdAt)}
                    </time>
                    {mine && detail.canSeeReadReceipts ? (
                      <span className="inline-flex items-center gap-0.5 font-semibold">
                        {message.readAt ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        {message.readAt ? "Read" : "Sent"}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/8 p-3">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write something real…"
          maxLength={1000}
          className="field-input flex-1 rounded-full"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white transition hover:scale-105 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
