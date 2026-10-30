import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/lib/api";

export function ConvexUserSync() {
  const { isAuthenticated } = useConvexAuth();
  const ensureViewer = useMutation(api.profiles.ensureViewer);

  useEffect(() => {
    if (!isAuthenticated) return;
    const displayName = window.localStorage.getItem("namflirt-signup-name") ?? undefined;
    void ensureViewer({ displayName })
      .then(() => {
        if (displayName) window.localStorage.removeItem("namflirt-signup-name");
      })
      .catch((error) => {
        console.error("Could not sync the signed-in user to Convex.", error);
      });
  }, [ensureViewer, isAuthenticated]);

  return null;
}
