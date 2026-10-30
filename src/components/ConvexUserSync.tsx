import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/lib/api";
import { isPlaceholderName, nameFromEmail } from "../../shared/profileName";

export function ConvexUserSync() {
  const { isAuthenticated } = useConvexAuth();
  const { isLoaded: isClerkLoaded, user } = useUser();
  const ensureViewer = useMutation(api.profiles.ensureViewer);

  useEffect(() => {
    if (!isAuthenticated || !isClerkLoaded) return;
    const storedName = window.localStorage.getItem("namflirt-signup-name")?.trim();
    const clerkName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    const email = user?.primaryEmailAddress?.emailAddress;
    const displayName =
      storedName || (isPlaceholderName(clerkName) ? nameFromEmail(email) : clerkName) || undefined;
    void ensureViewer({ displayName })
      .then(() => {
        if (displayName) window.localStorage.removeItem("namflirt-signup-name");
      })
      .catch((error) => {
        console.error("Could not sync the signed-in user to Convex.", error);
      });
  }, [ensureViewer, isAuthenticated, isClerkLoaded, user]);

  return null;
}
