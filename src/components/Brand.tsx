import { Link } from "@tanstack/react-router";

export function BrandName() {
  return (
    <span>
      namflirt<span className="text-primary">.</span>
    </span>
  );
}

export function BrandText({ children }: { children: string }) {
  return children
    .split(/(namflirt\.?)/gi)
    .map((part, index) =>
      /^namflirt\.?$/i.test(part) ? <BrandName key={`${part}-${index}`} /> : part,
    );
}

export function Brand({ to = "/" }: { to?: "/" | "/browse" }) {
  return (
    <Link
      to={to}
      className="brand-mark inline-flex items-center gap-2 text-lg font-black tracking-normal text-white"
      aria-label="namflirt. home"
    >
      <img
        src="/namflirt_logo.png"
        alt=""
        aria-hidden="true"
        className="h-9 w-9 shrink-0 object-contain"
      />
      <BrandName />
    </Link>
  );
}
