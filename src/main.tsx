import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexUserSync } from "./components/ConvexUserSync";
import { router } from "./router";
import "./styles.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const convex = new ConvexReactClient(convexUrl ?? "https://unconfigured-namflirt.convex.cloud");

const app = <RouterProvider router={router} />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInFallbackRedirectUrl="/auth"
        signUpFallbackRedirectUrl="/auth"
        afterSignOutUrl="/"
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <ConvexUserSync />
          {app}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <ConvexProvider client={convex}>{app}</ConvexProvider>
    )}
  </React.StrictMode>,
);
