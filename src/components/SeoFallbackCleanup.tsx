import { useEffect } from "react";

export function SeoFallbackCleanup() {
  useEffect(() => {
    document.querySelectorAll("[data-seo-fallback]").forEach((element) => element.remove());
  }, []);

  return null;
}
