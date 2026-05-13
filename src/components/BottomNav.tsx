import { Link, useLocation } from "@tanstack/react-router";
import { Compass, Heart, MessageCircle, User as UserIcon } from "lucide-react";

const tabs = [
  { to: "/browse", label: "Browse", Icon: Compass },
  { to: "/likes", label: "Likes", Icon: Heart },
  { to: "/messages", label: "Chats", Icon: MessageCircle },
  { to: "/me", label: "Me", Icon: UserIcon },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
