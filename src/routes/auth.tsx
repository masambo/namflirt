import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Heart, ArrowUpRight } from "lucide-react";
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
      <header className="px-6 py-6 mx-auto max-w-6xl w-full">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary grid place-items-center shadow-glow">
            <Heart className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-tight">NamFlirt</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {mode === "signup" ? "Get started" : "Welcome back"}
            </p>
            <h1 className="mt-3 font-display text-5xl font-medium text-balance leading-[1]">
              {mode === "signup" ? (
                <>Hello, <span className="italic font-light text-primary">stranger.</span></>
              ) : (
                <>Good to <span className="italic font-light text-primary">see you.</span></>
              )}
            </h1>
          </div>

          <div className="rounded-3xl bg-card shadow-card border hairline p-7">
            <form onSubmit={submit} className="space-y-4">
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
                className="group w-full flex items-center justify-between gap-2 rounded-full bg-primary pl-6 pr-2 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60 transition"
              >
                <span>{busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}</span>
                <span className="h-9 w-9 rounded-full bg-primary-foreground/15 grid place-items-center group-hover:translate-x-0.5 transition">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </form>

            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
            >
              {mode === "signup" ? (
                <>Already have an account? <span className="text-foreground font-medium underline-offset-4 hover:underline">Sign in</span></>
              ) : (
                <>New here? <span className="text-foreground font-medium underline-offset-4 hover:underline">Create an account</span></>
              )}
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
        className="mt-1.5 w-full rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/60"
      />
    </label>
  );
}
