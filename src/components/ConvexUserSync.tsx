import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/lib/api";

export function ConvexUserSync() {
  const { isAuthenticated } = useConvexAuth();
  const ensureViewer = useMutation(api.profiles.ensureViewer);

  useEffect(() => {
    if (!isAuthenticated) return;
    void ensureViewer({}).catch((error) => {
      console.error("Could not sync the signed-in user to Convex.", error);
    });
  }, [ensureViewer, isAuthenticated]);

  return null;
}
