import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  displayName: z.string().trim().min(2, "Name too short").max(60),
});
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Required").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate({ to: "/browse" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const v = signupSchema.parse({ email, password, displayName });
        const { error } = await supabase.auth.signUp({
          email: v.email,
          password: v.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: v.displayName },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to verify, then sign in.");
        setMode("signin");
      } else {
        const v = loginSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({
          email: v.email,
          password: v.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/browse" });
      }
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          NamFlirt
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-card shadow-card border border-border/50 p-8">
            <h1 className="font-display text-3xl font-bold text-balance">
              {mode === "signup" ? "Welcome to NamFlirt" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup" ? "Create your account in seconds." : "Sign in to keep matching."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <Field
                  label="Display name"
                  type="text"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="What should people call you?"
                />
              )}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === "signup" ? "At least 8 characters" : ""}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New to NamFlirt? Create an account"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to NamFlirt's community standards. Be kind, be real.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
