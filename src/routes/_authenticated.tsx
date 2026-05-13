import { createFileRoute, Outlet, Navigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfileCompleted(Boolean(data?.profile_completed));
      setProfileChecked(true);
    }
    if (user) check();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" />;
  if (!profileChecked) return <FullScreenLoader />;

  // Force onboarding if profile incomplete (except already on onboarding)
  if (!profileCompleted && !pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" />;
  }

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      {!pathname.startsWith("/onboarding") && <BottomNav />}
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Heart className="h-8 w-8 text-primary fill-primary animate-pulse" />
    </div>
  );
}
