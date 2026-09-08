import { SignIn, SignUp, useAuth } from "@clerk/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowLeft, KeyRound, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand, BrandName } from "@/components/Brand";
import { api } from "@/lib/api";
import { privateHead } from "@/lib/seo";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () =>
    privateHead(
      "Sign in or create an account | namflirt.",
      "Access your private namflirt. dating account.",
    ),
  component: AuthPage,
});

const clerkAppearance = {
  layout: {
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#ff4f87",
    colorBackground: "#141412",
    colorInputBackground: "#20201d",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,.58)",
    colorNeutral: "#ffffff",
    borderRadius: "8px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    socialButtonsRoot: "w-full",
    socialButtons: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      width: "100%",
      gap: "0.75rem",
    },
    socialButtonsBlockButton__apple: { display: "none" },
    socialButtonsIconButton__apple: { display: "none" },
    alternativeMethodsBlockButton__apple: { display: "none" },
    socialButtonsBlockButton:
      "h-11 w-full rounded-lg border border-white/10 bg-white/[.04] text-white shadow-none transition-colors hover:border-white/18 hover:bg-white/[.07]",
    socialButtonsBlockButtonText: "text-xs font-semibold text-white/85",
    lastAuthenticationStrategyBadge: "namflirt-last-used-badge",
    dividerRow: "my-4",
    dividerLine: "bg-white/12",
    dividerText: "px-3 text-[10px] font-semibold uppercase text-white/35",
    formField: "space-y-1.5",
    formFieldLabel: "text-[11px] font-semibold text-white/55",
    formFieldInput:
      "h-10 rounded-lg border border-white/10 bg-[#1d1d1a] px-3 text-sm text-white shadow-none transition-colors placeholder:text-white/25 focus:border-[#ff4f87]/70 focus:ring-2 focus:ring-[#ff4f87]/15",
    formButtonPrimary:
      "mt-1 h-10 rounded-lg bg-[#ff4f87] text-sm font-bold text-white shadow-none transition-colors hover:bg-[#ff6797]",
    footer: "hidden",
    footerActionText: "text-white/45",
    footerActionLink: "font-semibold text-[#ff4f87] hover:text-[#ff79a4]",
    identityPreviewText: "text-white",
    identityPreviewEditButton: "text-[#ff4f87]",
    formFieldAction: "text-xs font-bold text-[#ff4f87] hover:text-[#ff79a4]",
  },
} as const;

function AuthPage() {
  const configured = Boolean(
    import.meta.env.VITE_CONVEX_URL && import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <main className="auth-page grid min-h-screen overflow-hidden bg-[#10100e] lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,.72fr)]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/images/steps/make-it-real.jpg"
          alt="A couple enjoying time together"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute left-10 top-9">
          <Brand />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase text-white/70">
            <ShieldCheck className="h-4 w-4 text-primary" /> Private by design
          </div>
          <h2 className="max-w-xl text-3xl font-semibold leading-tight text-white xl:text-4xl">
            A thoughtful place to start something real.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            Meet people who value honest profiles, clear intentions and genuine conversation.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-6 sm:py-8">
          <p className="eyebrow">
            Your <BrandName /> account
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
            Meet your <span className="text-primary">person.</span>
          </h1>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/50">
            Sign in or create an account. Your profile and conversations stay private and connected.
          </p>

          <div className="mt-6 rounded-lg border border-white/10 bg-[#171715] p-4 shadow-[0_20px_50px_rgba(0,0,0,.28)] sm:p-5">
            {configured ? <ClerkSignIn /> : <ClerkSetupNotice />}
          </div>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-white/25">
            By continuing, you agree to our community guidelines and commit to treating people with
            respect.
          </p>
        </div>
      </section>
    </main>
  );
}

function ClerkSignIn() {
  const navigate = useNavigate();
  const { isLoaded: isClerkLoaded, isSignedIn, signOut } = useAuth();
  const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
  const [mode, setMode] = useState<"signin" | "signup">(() =>
    new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin",
  );
  const viewer = useQuery(api.profiles.viewer, isAuthenticated ? {} : "skip") as
    Profile | null | undefined;

  useEffect(() => {
    if (!isSignedIn || !isAuthenticated || viewer === undefined) return;
    void navigate({ to: viewer?.completed ? "/browse" : "/onboarding", replace: true });
  }, [isSignedIn, isAuthenticated, navigate, viewer]);

  if (
    !isClerkLoaded ||
    (isSignedIn && (isConvexLoading || (isAuthenticated && viewer === undefined)))
  ) {
    return <AuthConnecting />;
  }

  if (isSignedIn && !isAuthenticated) {
    return (
      <AuthConnectionIssue
        onCreateAccount={() => void signOut({ redirectUrl: "/auth?mode=signup" })}
        onSignOut={() => void signOut({ redirectUrl: "/auth" })}
      />
    );
  }

  if (isSignedIn) return <AuthConnecting />;

  return (
    <div>
      <div
        className="mb-4 grid grid-cols-2 rounded-lg border border-white/10 bg-black/20 p-1"
        role="tablist"
        aria-label="Account access"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          className={`h-9 rounded-md text-xs font-semibold transition-colors ${
            mode === "signin"
              ? "bg-white/[.09] text-white shadow-sm"
              : "text-white/45 hover:text-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          className={`h-9 rounded-md text-xs font-semibold transition-colors ${
            mode === "signup"
              ? "bg-white/[.09] text-white shadow-sm"
              : "text-white/45 hover:text-white"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "signin" ? (
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/auth"
          signUpFallbackRedirectUrl="/auth"
          appearance={clerkAppearance}
        />
      ) : (
        <SignUp
          routing="hash"
          fallbackRedirectUrl="/auth"
          signInFallbackRedirectUrl="/auth"
          appearance={clerkAppearance}
        />
      )}
    </div>
  );
}

function AuthConnecting() {
  return (
    <div className="py-8 text-center">
      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" />
      <h2 className="mt-5 text-xl font-semibold">Connecting your account</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/45">
        Confirming your secure profile session.
      </p>
    </div>
  );
}

function AuthConnectionIssue({
  onCreateAccount,
  onSignOut,
}: {
  onCreateAccount: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="py-3 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
        <KeyRound className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Account connection paused</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/45">
        Your sign-in is active, but your secure profile session did not finish connecting.
      </p>
      <div className="mt-6 grid gap-3">
        <button type="button" className="button-primary justify-center" onClick={onCreateAccount}>
          Create account
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="button-ghost justify-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <button type="button" className="button-ghost justify-center" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function ClerkSetupNotice() {
  return (
    <div className="py-3 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
        <KeyRound className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Sign-in is temporarily unavailable</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/45">
        We could not open account access right now. Please try again shortly.
      </p>
    </div>
  );
}
