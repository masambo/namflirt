import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth as useClerkAuth } from "@clerk/react";
import { useConvexAuth, useQuery } from "convex/react";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";
import { api } from "@/lib/api";
import { privateHead } from "@/lib/seo";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated")({
  head: () =>
    privateHead(
      "Your namflirt. account",
      "Private profiles, matches, messages and account settings.",
    ),
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { pathname } = useLocation();
  const viewer = useQuery(api.profiles.viewer, isAuthenticated ? {} : "skip") as
    (Profile & { preferences: unknown }) | null | undefined;
  const onboarding = pathname.startsWith("/onboarding");
  const needsProfile = isAuthenticated && viewer !== undefined && (!viewer || !viewer.completed);

  useEffect(() => {
    if (!isClerkLoaded || isLoading) return;
    if (!isSignedIn || !isAuthenticated) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (needsProfile && !onboarding) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [isClerkLoaded, isLoading, isSignedIn, isAuthenticated, navigate, needsProfile, onboarding]);

  if (!isClerkLoaded || isLoading || (isAuthenticated && viewer === undefined)) {
    return <AppLoader />;
  }
  if (!isSignedIn || !isAuthenticated || (needsProfile && !onboarding)) return <AppLoader />;

  return (
    <div className="min-h-screen pb-24 lg:pb-0 lg:pl-60">
      <PresenceHeartbeat />
      <Outlet />
      {onboarding ? null : <BottomNav />}
    </div>
  );
}

function AppLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-xs font-medium uppercase tracking-[.2em] text-white/30">
          Making connections
        </p>
      </div>
    </div>
  );
}
