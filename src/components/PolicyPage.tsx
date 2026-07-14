import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Brand, BrandText } from "@/components/Brand";

type PolicySection = {
  title: string;
  body: string;
  items?: string[];
};

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <main className="landing-shell min-h-screen">
      <header className="border-b border-white/8 bg-[#11110f]/88 backdrop-blur-2xl">
        <nav className="page-width flex h-24 items-center justify-between gap-4">
          <Brand />
          <Link to="/" className="button-ghost">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </nav>
      </header>

      <article className="page-width max-w-4xl py-16 md:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 text-5xl font-semibold leading-[.96] tracking-[-.065em] md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/55">
          <BrandText>{intro}</BrandText>
        </p>

        <div className="mt-12 grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.6rem] border border-white/10 bg-card p-6 md:p-8"
            >
              <h2 className="text-2xl font-black tracking-[-.045em] text-white">
                <BrandText>{section.title}</BrandText>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                <BrandText>{section.body}</BrandText>
              </p>
              {section.items ? (
                <ul className="mt-5 grid gap-3 text-sm font-bold leading-relaxed text-white/72">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <BrandText>{item}</BrandText>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
