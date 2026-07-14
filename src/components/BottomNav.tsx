import { Link, useLocation } from "@tanstack/react-router";
import { Compass, Crown, Heart, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { useQuery } from "convex/react";
import { Brand } from "@/components/Brand";
import { NotificationCenter } from "@/components/NotificationCenter";
import { api } from "@/lib/api";

const primaryTabs = [
  { to: "/browse", label: "Discover", Icon: Compass },
  { to: "/likes", label: "Likes", Icon: Heart },
  { to: "/messages", label: "Chats", Icon: MessageCircle },
] as const;

const accountTabs = [
  { to: "/plans", label: "Plans", Icon: Crown },
  { to: "/me", label: "Your profile", Icon: UserRound },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const adminAccess = useQuery(api.admin.access, {}) as { isAdmin: boolean } | undefined;
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/8 bg-[#131311] px-3 py-4 lg:flex">
        <div className="px-2 pb-6 pt-1">
          <Brand to="/browse" />
        </div>
        <nav className="space-y-1" aria-label="Main navigation">
          {primaryTabs.map((tab) => (
            <DesktopLink key={tab.to} {...tab} active={isActive(pathname, tab.to)} />
          ))}
          <NotificationCenter variant="desktop" />
        </nav>
        <nav
          className="mt-auto space-y-1 border-t border-white/8 pt-3"
          aria-label="Account navigation"
        >
          {adminAccess?.isAdmin ? (
            <DesktopLink
              to="/admin"
              label="Admin dashboard"
              Icon={ShieldCheck}
              active={isActive(pathname, "/admin")}
            />
          ) : null}
          {accountTabs.map((tab) => (
            <DesktopLink key={tab.to} {...tab} active={isActive(pathname, tab.to)} />
          ))}
        </nav>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#151513]/96 px-1 pt-1.5 shadow-[0_-16px_45px_rgba(0,0,0,.32)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
        aria-label="Main navigation"
      >
        {primaryTabs.slice(0, 2).map((tab) => (
          <MobileLink key={tab.to} {...tab} active={isActive(pathname, tab.to)} />
        ))}
        <MobileLink {...primaryTabs[2]} active={isActive(pathname, primaryTabs[2].to)} />
        <NotificationCenter variant="mobile" />
        <MobileLink
          {...accountTabs[1]}
          active={isActive(pathname, accountTabs[1].to)}
          label="You"
        />
      </nav>
    </>
  );
}

function DesktopLink({
  to,
  label,
  Icon,
  active,
}: {
  to: "/browse" | "/likes" | "/messages" | "/plans" | "/me" | "/admin";
  label: string;
  Icon: typeof Compass;
  active: boolean;
}) {
  return (
    <Link to={to} className={`app-nav-link ${active ? "app-nav-link-active" : ""}`}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      <span>{label}</span>
    </Link>
  );
}

function MobileLink({
  to,
  label,
  Icon,
  active,
}: {
  to: "/browse" | "/likes" | "/messages" | "/me";
  label: string;
  Icon: typeof Compass;
  active: boolean;
}) {
  return (
    <Link to={to} className={`mobile-nav-item ${active ? "text-primary" : "text-white/42"}`}>
      <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.5 : 1.8} />
      <span>{label}</span>
      {active ? <span className="absolute top-0 h-0.5 w-5 rounded-full bg-primary" /> : null}
    </Link>
  );
}

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}
