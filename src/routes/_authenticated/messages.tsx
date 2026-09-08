import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { MessageCircle, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { isOnline } from "@/lib/presence";
import type { Conversation } from "@/lib/types";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/messages")({ component: MessagesLayout });

function MessagesLayout() {
  const conversations = useQuery(api.conversations.list, {}) as Conversation[] | undefined;
  const { pathname } = useLocation();
  const detail = pathname.startsWith("/messages/");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(Date.now());
  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!conversations || !term) return conversations;
    return conversations.filter(
      (conversation) =>
        conversation.other?.displayName.toLowerCase().includes(term) ||
        conversation.lastMessage?.toLowerCase().includes(term),
    );
  }, [conversations, query]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="app-page page-width max-w-7xl">
      <header className="flex items-center justify-between py-6 md:py-8">
        <div className="lg:hidden">
          <Brand to="/browse" />
        </div>
        <span className="text-xs font-semibold text-white/30">
          {conversations?.length ?? 0} {conversations?.length === 1 ? "chat" : "chats"}
        </span>
      </header>
      <div className="grid min-h-0 gap-4 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={detail ? "hidden md:block" : "block"}>
          <p className="eyebrow">Your inbox</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-.065em]">Messages</h1>
          <label className="relative mt-5 block">
            <span className="sr-only">Search conversations</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="field-input h-11 min-h-11 rounded-full pl-11 pr-11"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/35 hover:bg-white/5 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
          <div className="mt-7 space-y-1.5">
            {!conversations ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />
              ))
            ) : filteredConversations?.length ? (
              filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation._id}
                  conversation={conversation}
                  active={pathname.endsWith(conversation._id)}
                  now={now}
                />
              ))
            ) : query ? (
              <div className="rounded-2xl border border-white/8 px-5 py-10 text-center">
                <Search className="mx-auto h-5 w-5 text-white/25" />
                <p className="mt-3 text-sm font-semibold">No conversations found</p>
                <p className="mt-1 text-xs text-white/30">Try another name or message.</p>
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-white/8 bg-white/[.025] p-7 text-center">
                <MessageCircle className="mx-auto h-5 w-5 text-primary" />
                <h2 className="mt-4 text-xl font-semibold">No conversations yet</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/35">
                  A match or a thoughtful hello will start one.
                </p>
                <Link to="/browse" className="button-ghost mt-5">
                  Discover people
                </Link>
              </div>
            )}
          </div>
        </aside>
        <section className={detail ? "block" : "hidden md:grid md:place-items-center"}>
          {detail ? (
            <Outlet />
          ) : (
            <div className="text-center text-white/25">
              <MessageCircle className="mx-auto h-7 w-7" />
              <p className="mt-3 text-sm">Choose a conversation</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ConversationRow({
  conversation,
  active,
  now,
}: {
  conversation: Conversation;
  active: boolean;
  now: number;
}) {
  const other = conversation.other;
  const online = isOnline(other?.lastActive, now);
  const unread = conversation.unreadCount ?? 0;
  return (
    <Link
      to="/messages/$id"
      params={{ id: conversation._id }}
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${active ? "border-white/10 bg-white/[.06]" : "border-transparent hover:bg-white/[.035]"}`}
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-white/5">
          {other?.photos[0] ? (
            <img src={other.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        {online ? (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-[#181816] bg-[#55d89a]" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`truncate tracking-[-.02em] ${unread ? "font-black" : "font-semibold"}`}>
            {other?.displayName ?? "Member"}
          </h2>
          <time className="text-[10px] text-white/25">
            {conversation.lastMessageAt
              ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
                  conversation.lastMessageAt,
                )
              : "New"}
          </time>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-xs ${unread ? "text-white/70" : "text-white/35"}`}
          >
            {conversation.lastMessage ?? "Start the conversation"}
          </p>
          {unread ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[9px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
