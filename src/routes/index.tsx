import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Heart, Sparkles, Languages, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/browse" />;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-sunset opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)] opacity-20" />
        <div className="relative mx-auto max-w-5xl px-6 pt-8 pb-24 md:pt-12 md:pb-32">
          <nav className="flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2 font-display text-2xl font-bold">
              <Heart className="h-6 w-6 fill-current" />
              NamFlirt
            </div>
            <Link
              to="/auth"
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/25"
            >
              Sign in
            </Link>
          </nav>

          <div className="mt-16 md:mt-24 max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3 w-3" /> Made in Namibia
            </span>
            <h1 className="mt-5 text-5xl md:text-7xl font-display font-black leading-[0.95] text-balance">
              Find love that speaks your language.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl text-balance">
              NamFlirt matches Namibians by culture, language, and what really
              matters to you — no more endless swiping. Browse real people, see
              your match score, and start something real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-card hover:opacity-90"
              >
                Create your profile
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/30"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-balance max-w-2xl">
          Built for the way Namibians actually meet.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: Languages,
              title: "Language matters",
              body: "Match with people who speak Oshiwambo, Otjiherero, Khoekhoegowab, Rukwangali, English, Afrikaans and more.",
            },
            {
              Icon: MapPin,
              title: "Region by region",
              body: "From Khomas to Zambezi to Kavango — find singles in your town or open it up to the whole country.",
            },
            {
              Icon: Sparkles,
              title: "Real compatibility",
              body: "Every profile shows a match score based on language, tribe, age, region, hobbies and goals.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-3xl bg-card p-6 shadow-card border border-border/50">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-display font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl bg-night px-8 py-14 text-center shadow-card">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-balance">
            Your person is out there.
          </h2>
          <p className="mt-3 text-white/80 max-w-md mx-auto">
            Join NamFlirt today and start meeting Namibians who share your language, your region, and your story.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90"
          >
            Get started — it's free
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NamFlirt Namibia
      </footer>
    </div>
  );
}
