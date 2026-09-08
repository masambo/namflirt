import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  Apple,
  ArrowRight,
  Check,
  Crown,
  HeartHandshake,
  MapPinned,
  MessagesSquare,
  Play,
  ShieldCheck,
  Star,
  X,
  Zap,
} from "lucide-react";
import { Brand, BrandName, BrandText } from "@/components/Brand";
import { PLAN_DEFINITIONS, type PlanDefinition } from "@/lib/plans";
import { homeStructuredData, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: "Namibian Dating for Meaningful Connections | namflirt.",
      description:
        "Dating in Namibia for single women and single men. Meet Namibian singles on namflirt., a Namibia-first dating site built for genuine local connection.",
      path: "/",
      structuredData: homeStructuredData,
    }),
  component: Landing,
});

const heroPortraits = [
  {
    src: "/images/hero/Herero_hero.png",
    alt: "namflirt. member in Herero dress",
    className: "hero-portrait-one",
  },
  {
    src: "/images/hero/vambo_hero.png",
    alt: "namflirt. member in Oshiwambo dress",
    className: "hero-portrait-two",
  },
  {
    src: "/images/hero/Kavango_hero.png",
    alt: "namflirt. member in Kavango-inspired beadwork",
    className: "hero-portrait-three",
  },
  {
    src: "/images/hero/Nama_hero.png",
    alt: "namflirt. member in Nama dress",
    className: "hero-portrait-four",
  },
  {
    src: "/images/hero/Bsaster_hero.png",
    alt: "namflirt. member in traditional dress",
    className: "hero-portrait-five",
  },
  {
    src: "/images/hero/Geman_hero.png",
    alt: "namflirt. member in German-inspired dress",
    className: "hero-portrait-six",
  },
] as const;

type FooterRoute =
  | "/auth"
  | "/terms"
  | "/safety"
  | "/privacy"
  | "/community-guidelines"
  | "/dating-in-namibia"
  | "/single-women-namibia"
  | "/single-men-namibia";

type FooterLink =
  | { label: string; href: `#${string}`; to?: never }
  | { label: string; to: FooterRoute; href?: never };

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Why namflirt.", href: "#different" },
      { label: "How it works", href: "#how" },
      { label: "Dating in Namibia", to: "/dating-in-namibia" },
      { label: "Single women", to: "/single-women-namibia" },
      { label: "Single men", to: "/single-men-namibia" },
      { label: "Pricing", href: "#pricing" },
      { label: "Join now", to: "/auth" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms", to: "/terms" },
      { label: "Safety", to: "/safety" },
      { label: "Privacy", to: "/privacy" },
      { label: "Community guidelines", to: "/community-guidelines" },
    ],
  },
] satisfies FooterGroup[];

function Landing() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) => entry.isIntersecting && entry.target.classList.add("is-visible"),
        ),
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    const fallback = window.setTimeout(
      () => elements.forEach((element) => element.classList.add("is-visible")),
      1400,
    );
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return (
    <div className="landing-shell overflow-hidden">
      <header className="landing-header sticky top-0 z-50 border-b border-white/8 bg-[#11110f]/88 backdrop-blur-2xl">
        <nav className="page-width flex h-24 items-center justify-between gap-5">
          <Brand />
          <div className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-white/[.055] p-1.5 text-[15px] font-bold text-white/78 shadow-[0_18px_50px_rgba(0,0,0,.32)] md:flex">
            <a href="#different" className="nav-link rounded-full px-5 py-3">
              Why <BrandName />
            </a>
            <a href="#how" className="nav-link rounded-full px-5 py-3">
              How it works
            </a>
            <a href="#pricing" className="nav-link rounded-full px-5 py-3">
              Pricing
            </a>
            <a href="#safety" className="nav-link rounded-full px-5 py-3">
              Safety
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="button-primary px-5 sm:px-7">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
        <div className="page-width flex gap-2 overflow-x-auto pb-4 md:hidden">
          <a href="#different" className="mobile-nav-link">
            Why <BrandName />
          </a>
          <a href="#how" className="mobile-nav-link">
            How it works
          </a>
          <a href="#pricing" className="mobile-nav-link">
            Pricing
          </a>
          <a href="#safety" className="mobile-nav-link">
            Safety
          </a>
        </div>
      </header>

      <main>
        <section className="page-width hero-stage relative grid min-h-[calc(100vh-6rem)] items-center gap-14 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-10">
          <div className="hero-glow hero-glow-one" aria-hidden="true" />
          <div className="hero-glow hero-glow-two" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="hero-title max-w-[780px] text-[clamp(3.55rem,9.4vw,9rem)] font-semibold leading-[.78] tracking-[-.085em]">
              Dating in
              <br />
              <span className="text-primary">Namibia.</span>
            </h1>
            <p className="hero-copy mt-8 max-w-xl text-lg leading-relaxed text-white/55 md:text-xl">
              Meet single women and single men in Namibia and around the world. Choose local or
              international connections, with culture, language and your preferences at the heart.
            </p>
            <div className="hero-actions mt-9 flex flex-wrap items-center gap-3">
              <Link to="/auth" className="button-primary">
                Create your profile <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="button-ghost">
                See pricing
              </a>
            </div>
            <div className="hero-meta mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-white/42">
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" /> No endless swiping
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" /> Compatibility, explained
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" /> Free to join
              </span>
            </div>
          </div>

          <div className="hero-deck hero-portrait-collage relative mx-auto h-[490px] w-full max-w-[650px] sm:h-[670px] lg:h-[720px]">
            <div className="hero-deck-glow" aria-hidden="true" />
            <div className="hero-pink-ambient" aria-hidden="true" />
            <svg
              className="hero-art hero-art-orbit"
              viewBox="0 0 260 190"
              fill="none"
              aria-hidden="true"
            >
              <path d="M18 142C48 36 176 8 238 68C276 105 215 166 138 170C76 174 37 151 53 105C69 59 153 43 197 76" />
              <path d="M31 151C86 184 194 180 231 123" />
              <circle cx="31" cy="151" r="5" />
            </svg>
            <svg
              className="hero-art hero-art-heart"
              viewBox="0 0 120 120"
              fill="none"
              aria-hidden="true"
            >
              <path d="M60 99C49 86 18 67 18 39C18 19 44 13 60 34C76 13 102 19 102 39C102 67 71 86 60 99Z" />
              <path d="M91 15L95 5M101 21L111 16M96 29L106 35" />
            </svg>
            <svg
              className="hero-art hero-art-spark"
              viewBox="0 0 80 80"
              fill="none"
              aria-hidden="true"
            >
              <path d="M40 8C42 29 51 38 72 40C51 42 42 51 40 72C38 51 29 42 8 40C29 38 38 29 40 8Z" />
            </svg>
            <div className="hero-portrait-grid">
              {heroPortraits.map((portrait) => (
                <div key={portrait.src} className="hero-photo-compartment">
                  <figure className={`hero-portrait-card ${portrait.className}`} tabIndex={0}>
                    <img src={portrait.src} alt={portrait.alt} />
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="different" data-reveal className="reveal-section page-width py-20 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid min-h-[34rem] grid-cols-[auto_minmax(0,1fr)] items-end gap-8 overflow-visible sm:gap-12">
              <h2 className="self-center text-4xl font-semibold text-white sm:text-5xl md:text-6xl [writing-mode:vertical-rl] rotate-180">
                Why <BrandName />
              </h2>
              <img
                src="/images/couples.png"
                alt="A happy Namibian couple embracing"
                className="h-auto max-h-[42rem] w-auto max-w-full justify-self-center object-contain opacity-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Feature
                icon={<HeartHandshake />}
                number="01"
                title="Meet across cultures"
                body="Discover people from different Namibian backgrounds with context for language, values, region and relationship goals."
              />
              <Feature
                icon={<MapPinned />}
                number="02"
                title="Rooted in Namibia"
                body="Browse by towns, regions, languages and the cultural details generic dating apps tend to flatten."
              />
              <Feature
                icon={<MessagesSquare />}
                number="03"
                title="Conversation first"
                body="Profiles give you something real to respond to, so opening lines feel human instead of forced."
              />
              <Feature
                icon={<ShieldCheck />}
                number="04"
                title="Respect by design"
                body="Thoughtful profiles, reporting controls and match-aware messaging help protect a diverse community."
              />
            </div>
          </div>
        </section>

        <section id="how" className="page-width py-20 md:py-32">
          <div className="rounded-[2.5rem] border border-white/10 bg-[#1a1a17] px-6 py-14 md:px-14 md:py-20">
            <div className="grid items-end gap-10 lg:grid-cols-2">
              <div>
                <p className="eyebrow">Three simple steps</p>
                <h2 className="mt-5 text-5xl font-semibold tracking-[-.065em] md:text-7xl">
                  A profile that feels like you.
                </h2>
              </div>
              <p className="max-w-md text-lg leading-relaxed text-white/50 lg:justify-self-end">
                Tell us what matters, meet people from the cultures and places that shape Namibia,
                then start a conversation when the feeling is mutual.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
              <Step
                number="01"
                title="Tell your story"
                body="Add your photos, languages, region, cultural background, interests and what you are looking for."
                image="/images/steps/tell-your-story.jpg"
                alt="Hands choosing personal photos for a dating profile"
              />
              <Step
                number="02"
                title="Explore your fit"
                body="Browse thoughtfully ranked people and understand what you share, and what you can learn from each other."
                image="/images/steps/explore-your-fit.jpg"
                alt="A woman thoughtfully exploring compatible profiles"
              />
              <Step
                number="03"
                title="Make it real"
                body="Like, match and move into a calm, real-time conversation."
                image="/images/steps/make-it-real.jpg"
                alt="Two people enjoying a relaxed first conversation"
              />
            </div>
          </div>
        </section>

        <section id="pricing" data-reveal className="reveal-section page-width py-20 md:py-32">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Plans</p>
              <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.95] tracking-[-.065em] md:text-7xl">
                Start with 14 days of Premium.
              </h2>
            </div>
            <Link to="/plans" className="button-ghost self-start md:self-auto">
              Compare all plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {PLAN_DEFINITIONS.map((plan, index) => (
              <PricingCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </section>

        <section
          id="safety"
          className="cta-image-section page-width relative isolate flex min-h-[640px] items-center justify-center overflow-hidden rounded-[2.5rem] px-6 py-28 text-center md:min-h-[760px] md:rounded-[3.5rem] md:py-40"
        >
          <img
            src="/images/someone-worth-meeting.png"
            alt=""
            aria-hidden="true"
            className="cta-background absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="cta-image-content">
            <p className="eyebrow justify-center text-white/65">Ready when you are</p>
            <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(3.8rem,9vw,8rem)] font-semibold leading-[.82] tracking-[-.085em] text-white drop-shadow-[0_12px_50px_rgba(0,0,0,.55)]">
              Someone worth
              <br />
              <span className="text-primary">meeting.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-md text-lg text-white/72 drop-shadow-lg">
              Create your profile in a few minutes. Be honest, be curious, be kind.
            </p>
            <Link to="/auth" className="button-primary mt-9">
              Join <BrandName /> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-24 border-t border-white/8 bg-[#0d0d0c]">
        <div className="page-width grid gap-12 py-14 lg:grid-cols-[1.15fr_.85fr_.85fr]">
          <div className="max-w-md">
            <Brand />
            <p className="mt-6 text-sm leading-relaxed text-white/48">
              <BrandName /> is built for people in Namibia who want to meet with intention,
              understand each other's backgrounds and start conversations with respect.
            </p>
            <StoreBadges />
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black uppercase tracking-[.16em] text-white/35">
                {group.title}
              </h3>
              <nav className="mt-5 grid gap-3">
                {group.links.map((link) =>
                  link.to ? (
                    <Link
                      key={link.label}
                      to={link.to}
                      className="text-sm font-bold text-white/58 transition hover:text-white"
                    >
                      <BrandText>{link.label}</BrandText>
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-bold text-white/58 transition hover:text-white"
                    >
                      <BrandText>{link.label}</BrandText>
                    </a>
                  ),
                )}
              </nav>
            </div>
          ))}

          <div className="border-t border-white/8 pt-8 text-xs text-white/35 lg:col-span-3">
            <p>
              (c) {new Date().getFullYear()} <BrandName /> Dating across Namibia's cultures.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StoreBadges() {
  return (
    <div className="mt-7 flex flex-wrap gap-3" aria-label="namflirt. mobile apps coming soon">
      <span className="inline-flex h-14 min-w-40 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 text-left text-white/75">
        <Apple className="h-6 w-6 shrink-0 text-white" />
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[.14em] text-primary">
            Coming soon
          </span>
          <span className="block text-sm font-black">App Store</span>
        </span>
      </span>
      <span className="inline-flex h-14 min-w-40 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 text-left text-white/75">
        <Play className="h-6 w-6 shrink-0 fill-primary/25 text-white" />
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[.14em] text-primary">
            Coming soon
          </span>
          <span className="block text-sm font-black">Play Store</span>
        </span>
      </span>
    </div>
  );
}

function Feature({
  icon,
  number,
  title,
  body,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  body: string;
}) {
  return (
    <article className="feature-card group min-h-64 bg-card p-7">
      <div className="flex items-start justify-between">
        <span className="feature-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="feature-number">{number}</span>
      </div>
      <h3 className="mt-12 text-2xl font-semibold tracking-[-.045em]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/45">{body}</p>
    </article>
  );
}

function Step({
  number,
  title,
  body,
  image,
  alt,
}: {
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
}) {
  return (
    <article className="step-card group bg-[#151513] p-3 md:p-4">
      <div className="relative aspect-[3/2] overflow-hidden rounded-[1.35rem]">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="step-card-image h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <span className="absolute left-3 top-3 grid h-8 min-w-8 place-items-center rounded-full border border-white/12 bg-black/45 px-2 text-[10px] font-black text-primary backdrop-blur-xl">
          {number}
        </span>
      </div>
      <div className="px-3 pb-4 pt-6 md:px-4 md:pb-5">
        <h3 className="text-2xl font-semibold tracking-[-.04em]">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/45">{body}</p>
      </div>
    </article>
  );
}

function PricingCard({ plan, index }: { plan: PlanDefinition; index: number }) {
  const featured = plan.id !== "free";
  const isVip = plan.id === "vip";
  return (
    <article
      style={{ transitionDelay: `${index * 80}ms` }}
      className={`pricing-card relative flex min-h-[520px] flex-col overflow-hidden rounded-[1.7rem] border bg-card p-6 shadow-[0_24px_80px_rgba(0,0,0,.26)] ${isVip ? "border-primary" : featured ? "border-primary/55" : "border-white/10"}`}
    >
      {plan.badge ? (
        <div
          className={`absolute inset-x-0 top-0 h-8 bg-primary text-center text-[10px] font-black uppercase leading-8 text-white ${isVip ? "shadow-[0_8px_30px_rgba(255,79,135,.32)]" : "opacity-85"}`}
        >
          {plan.badge}
        </div>
      ) : null}
      <div className={`flex h-full flex-col ${plan.badge ? "pt-8" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {plan.id === "vip" ? (
              <Crown className="h-5 w-5 text-primary" />
            ) : plan.id === "premium" ? (
              <Star className="h-5 w-5 text-primary" />
            ) : (
              <Zap className="h-5 w-5 text-white/45" />
            )}
            <h3
              className={`text-2xl font-black tracking-[-.045em] ${featured ? "text-primary" : "text-white"}`}
            >
              {plan.name}
            </h3>
          </div>
          <p className="text-3xl font-black tracking-[-.065em] text-white">
            {plan.price}
            <span className="text-sm font-medium tracking-normal text-white/45">
              {plan.cadence}
            </span>
          </p>
        </div>
        <ul className="mt-7 space-y-3 text-sm font-bold text-white/88">
          {featuresForPlan(plan).map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
          {unavailableForPlan(plan).map((feature) => (
            <li key={feature} className="flex gap-2 text-white/22">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/plans"
          className={`mt-auto flex h-14 items-center justify-center gap-2 rounded-xl text-sm font-black transition hover:brightness-110 ${featured ? "bg-primary text-white shadow-[0_12px_32px_rgba(255,79,135,.2)]" : "bg-white/[.07] text-white/65"}`}
        >
          {isVip ? "VIP preview" : featured ? "Premium trial" : "Free plan"}{" "}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function featuresForPlan(plan: PlanDefinition) {
  if (plan.id === "premium")
    return [
      "100 messages per month",
      "See who liked you",
      "View up to 100 profiles",
      "Unlimited likes",
      "Advanced filters",
      "Read receipts",
    ];
  if (plan.id === "vip")
    return [
      "Everything in Premium",
      "Unlimited messages",
      "Unlimited profile views",
      "Message anyone without matching",
      "VIP badge on profile",
      "Priority in search results",
      "Priority support",
      "Early access to new features",
    ];
  return [
    "10 messages per month",
    "View up to 10 profiles",
    "10 likes per day",
    "Basic match suggestions",
  ];
}

function unavailableForPlan(plan: PlanDefinition) {
  if (plan.id === "free")
    return ["See who liked you", "Unlimited messages", "Boost profile", "Read receipts"];
  if (plan.id === "premium") return ["Profile boost", "Priority support", "VIP badge"];
  return [];
}
