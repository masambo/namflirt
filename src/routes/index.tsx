import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Heart, ArrowUpRight, Languages, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/browse" />;

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <nav className="relative z-20 mx-auto max-w-6xl px-6 pt-7 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary grid place-items-center shadow-glow">
            <Heart className="h-4 w-4 fill-primary-foreground text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-tight">NamFlirt</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full border hairline px-4 py-2 text-xs font-medium tracking-wide uppercase hover:bg-card transition"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <header className="relative">
        <div className="relative mx-auto max-w-6xl px-6 pt-16 md:pt-24 pb-20">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-card/40 backdrop-blur px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Made in Namibia · For Namibians
          </span>

          <h1 className="mt-7 font-display text-[14vw] md:text-[7.5rem] leading-[0.9] font-medium text-balance">
            Love that <span className="italic font-light text-primary">speaks</span>
            <br />
            your <span className="italic font-light">language.</span>
          </h1>

          <div className="mt-10 grid md:grid-cols-12 gap-8 items-end">
            <p className="md:col-span-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              NamFlirt matches Namibians by culture, language, region and what actually matters — no swiping. Browse real people, see your compatibility score, start something real.
            </p>

            <div className="md:col-span-6 flex flex-wrap gap-3 md:justify-end">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 rounded-full bg-primary pl-6 pr-2 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition"
              >
                Create your profile
                <span className="h-9 w-9 rounded-full bg-primary-foreground/15 grid place-items-center group-hover:translate-x-0.5 transition">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center rounded-full border hairline px-5 py-3 text-sm font-medium hover:bg-card transition"
              >
                I already have one
              </Link>
            </div>
          </div>

          {/* Editorial profile preview */}
          <div className="mt-16 md:mt-24 relative">
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <PreviewCard
                className="col-span-7 md:col-span-5 aspect-[3/4] md:aspect-[3/4]"
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80"
                name="Naita"
                meta="Windhoek · Oshiwambo"
                score={94}
              />
              <div className="col-span-5 md:col-span-3 flex flex-col gap-4 md:gap-6">
                <PreviewCard
                  className="aspect-square"
                  src="https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80"
                  name="Theo"
                  meta="Swakopmund"
                  score={88}
                />
                <div className="flex-1 rounded-3xl border hairline bg-card/60 backdrop-blur p-5 flex flex-col justify-between">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="font-display text-2xl leading-tight">
                    Match by <span className="italic">language</span>, tribe & region.
                  </p>
                </div>
              </div>
              <PreviewCard
                className="hidden md:block md:col-span-4 aspect-[4/5]"
                src="https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80"
                name="Linea"
                meta="Oshakati · Otjiherero"
                score={91}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <h2 className="font-display text-4xl md:text-6xl font-medium text-balance max-w-xl leading-[1.02]">
            Built for the way <span className="italic font-light text-primary">we</span> meet.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Three things make NamFlirt different from every other dating app you've tried.
          </p>
        </div>

        <div className="mt-16 grid gap-px md:grid-cols-3 bg-border/40 rounded-3xl overflow-hidden border hairline">
          <Feature index="01" Icon={Languages} title="Language matters" body="Oshiwambo. Otjiherero. Khoekhoegowab. Rukwangali. Afrikaans. English. Find people who speak yours — first." />
          <Feature index="02" Icon={MapPin} title="Region by region" body="From Khomas to Zambezi to Kavango. Filter by region, town, or open it up to the whole country." />
          <Feature index="03" Icon={Sparkles} title="Real compatibility" body="Every profile shows a score based on language, tribe, age, region, hobbies and goals. No guesswork." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="relative rounded-[2.5rem] bg-ember border hairline px-8 md:px-16 py-20 md:py-28 text-center overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <p className="relative text-xs font-medium tracking-[0.2em] uppercase text-primary">No swipes · No games</p>
          <h2 className="relative mt-5 font-display text-5xl md:text-7xl font-medium text-balance leading-[0.95]">
            Your person is <span className="italic font-light">out there.</span>
          </h2>
          <p className="relative mt-5 text-muted-foreground max-w-md mx-auto">
            Join today and meet Namibians who share your language, your region, your story.
          </p>
          <Link
            to="/auth"
            className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-primary pl-7 pr-2 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition"
          >
            Start free
            <span className="h-9 w-9 rounded-full bg-primary-foreground/15 grid place-items-center">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} NamFlirt Namibia</span>
          <span className="font-display italic">Be kind. Be real.</span>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  className = "",
  src,
  name,
  meta,
  score,
}: {
  className?: string;
  src: string;
  name: string;
  meta: string;
  score: number;
}) {
  return (
    <div className={`relative rounded-3xl overflow-hidden border hairline shadow-card group ${className}`}>
      <img src={src} alt={name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold shadow-soft">
          <Heart className="h-3 w-3 fill-current" />
          {score}%
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="font-display text-lg leading-tight">{name}</div>
        <div className="text-[11px] uppercase tracking-wider text-white/70">{meta}</div>
      </div>
    </div>
  );
}

function Feature({ index, Icon, title, body }: { index: string; Icon: typeof Languages; title: string; body: string }) {
  return (
    <div className="bg-card p-8 md:p-10 group hover:bg-card/60 transition">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono tracking-widest text-muted-foreground">{index}</span>
        <div className="h-10 w-10 rounded-full bg-background grid place-items-center border hairline text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3 className="mt-10 font-display text-2xl md:text-3xl font-medium leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
