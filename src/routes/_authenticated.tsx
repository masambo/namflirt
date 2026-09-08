import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth as useClerkAuth, useClerk } from "@clerk/react";
import { useConvexAuth, useQuery } from "convex/react";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";
import { api } from "@/lib/api";
import { privateHead } from "@/lib/seo";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated")({
  head: () => privateHead("namflirt.", "Private profiles, matches, messages and account settings."),
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { pathname } = useLocation();
  const viewer = useQuery(api.profiles.viewer, isAuthenticated ? {} : "skip") as
    (Profile & { preferences: unknown }) | null | undefined;
  const onboarding = pathname.startsWith("/onboarding");
  const needsProfile =
    isAuthenticated &&
    viewer !== undefined &&
    viewer?.status !== "deleted" &&
    (!viewer || !viewer.completed || !viewer.photos.length);

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
  if (viewer?.status === "suspended" || viewer?.status === "deleted") {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-red-400/10 text-red-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <p className="admin-label mt-5">
            {viewer.status === "deleted" ? "Profile deleted" : "Account paused"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {viewer.status === "deleted"
              ? "Your profile has been removed."
              : "Your account is under review."}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            {viewer.status === "deleted"
              ? "Your profile is no longer visible to other members and you cannot use this account."
              : "Your profile and interactions are temporarily unavailable."}{" "}
            Contact the namflirt. safety team if you believe this was a mistake.
          </p>
          <button
            onClick={async () => {
              await signOut();
              await navigate({ to: "/" });
            }}
            className="admin-button-secondary mt-6"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-dvh lg:pl-60">
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
