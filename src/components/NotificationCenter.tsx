import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck, Heart, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NotificationItem {
  _id: string;
  type: "like" | "match" | "message";
  actorProfileId: string;
  conversationId?: string;
  messagePreview?: string;
  read: boolean;
  createdAt: number;
  actor: Profile | null;
}

interface NotificationResult {
  items: NotificationItem[];
  unreadCount: number;
}

export function NotificationCenter({ variant }: { variant: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const result = useQuery(api.notifications.list, {}) as NotificationResult | undefined;
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unread = result?.unreadCount ?? 0;
  const desktop = variant === "desktop";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={
            desktop
              ? "app-nav-link relative w-full"
              : `mobile-nav-item relative ${open ? "text-primary" : "text-white/42"}`
          }
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <span className="relative">
            <Bell className="h-[19px] w-[19px]" />
            {unread ? (
              <span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </span>
          <span>{desktop ? "Notifications" : "Alerts"}</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(92vw,420px)] border-white/10 bg-[#151513] p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="border-b border-white/8 px-5 pb-5 pt-6 text-left">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle className="text-2xl tracking-[-.04em]">Notifications</SheetTitle>
              <SheetDescription className="mt-1 text-xs text-white/38">
                Likes, matches and new messages.
              </SheetDescription>
            </div>
            {unread ? (
              <button
                type="button"
                onClick={() => void markAllRead({})}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-white"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark read
              </button>
            ) : null}
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-6.5rem)] overflow-y-auto p-3">
          {!result ? (
            <NotificationSkeleton />
          ) : result.items.length ? (
            <div className="space-y-1.5">
              {result.items.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onRead={() => void markRead({ notificationId: notification._id })}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[55vh] place-items-center px-6 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 text-primary">
                  <Bell className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-xl font-semibold">All quiet for now.</h2>
                <p className="mt-2 text-xs leading-relaxed text-white/38">
                  New likes, matches and messages will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationItem;
  onRead: () => void;
}) {
  const actorName = notification.actor?.displayName ?? "Someone";
  const content = notificationContent(notification.type, actorName, notification.messagePreview);
  const row = (
    <div
      className={`group flex gap-3 rounded-lg border px-3 py-3.5 text-left transition hover:bg-white/[.045] ${
        notification.read
          ? "border-transparent bg-transparent"
          : "border-primary/18 bg-primary/[.055]"
      }`}
    >
      <span className="relative mt-1 h-11 w-11 shrink-0">
        <span className="block h-11 w-11 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          {notification.actor?.photos[0] ? (
            <img src={notification.actor.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-sm font-black text-primary">
              {actorName.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#151513] bg-primary text-white shadow-[0_5px_14px_rgba(255,79,135,.35)]">
          {content.icon}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white/88">{content.title}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-white/38">
          {content.description}
        </span>
        <span className="mt-2 block text-[10px] font-semibold text-white/24">
          {timeAgo(notification.createdAt)}
        </span>
      </span>
      {!notification.read ? <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" /> : null}
    </div>
  );

  return (
    <SheetClose asChild>
      {notification.type === "message" && notification.conversationId ? (
        <Link
          to="/messages/$id"
          params={{ id: notification.conversationId }}
          onClick={onRead}
          className="block"
        >
          {row}
        </Link>
      ) : (
        <Link
          to="/profile/$id"
          params={{ id: notification.actorProfileId }}
          onClick={onRead}
          className="block"
        >
          {row}
        </Link>
      )}
    </SheetClose>
  );
}

function notificationContent(type: NotificationItem["type"], name: string, preview?: string) {
  if (type === "match") {
    return {
      title: `You matched with ${name}`,
      description: "The feeling is mutual. Start a conversation when you're ready.",
      icon: <Sparkles className="h-3 w-3" />,
    };
  }
  if (type === "message") {
    return {
      title: `${name} sent a message`,
      description: preview || "Open the conversation to reply.",
      icon: <MessageCircle className="h-3 w-3" />,
    };
  }
  return {
    title: `${name} liked you`,
    description: "Take a look and see whether the feeling is mutual.",
    icon: <Heart className="h-3 w-3 fill-current" />,
  };
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(timestamp).toLocaleDateString();
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[76px] animate-pulse rounded-lg bg-white/[.035]" />
      ))}
    </div>
  );
}
