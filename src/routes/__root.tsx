import { HeadContent, Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { SeoFallbackCleanup } from "@/components/SeoFallbackCleanup";
import { Toaster } from "@/components/ui/sonner";
import { privateHead } from "@/lib/seo";

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Lost connection</p>
        <h1 className="mt-4 text-7xl font-semibold tracking-[-0.07em]">404</h1>
        <p className="mt-3 text-muted-foreground">This page has left the conversation.</p>
        <Link to="/" className="button-primary mt-8">
          Back home
        </Link>
      </div>
    </main>
  );
}

export const Route = createRootRoute({
  head: () =>
    privateHead(
      "namflirt. | Namibian dating with intention",
      "A thoughtful dating experience built for people across Namibia.",
    ),
  component: () => (
    <>
      <HeadContent />
      <SeoFallbackCleanup />
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  ),
  notFoundComponent: NotFound,
});
