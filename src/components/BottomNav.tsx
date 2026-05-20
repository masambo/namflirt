import { Link, useLocation } from "@tanstack/react-router";
import { Compass, Heart, MessageCircle, User as UserIcon } from "lucide-react";

const tabs = [
  { to: "/browse", label: "Discover", Icon: Compass },
  { to: "/likes", label: "Likes", Icon: Heart },
  { to: "/messages", label: "Chats", Icon: MessageCircle },
  { to: "/me", label: "Profile", Icon: UserIcon },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-sm rounded-full bg-card/85 backdrop-blur-xl border hairline shadow-card grid grid-cols-4 p-1.5">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex flex-col items-center justify-center gap-0.5 rounded-full py-2 text-[10px] font-medium tracking-wide uppercase transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? "fill-current/20" : ""}`} />
              <span className={active ? "" : "opacity-80"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
