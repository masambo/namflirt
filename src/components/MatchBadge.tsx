import { Heart } from "lucide-react";

export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz =
    size === "lg" ? "px-3.5 py-1.5 text-sm gap-1.5"
    : size === "sm" ? "px-2.5 py-1 text-[11px] gap-1"
    : "px-3 py-1 text-xs gap-1.5";
  const icon = size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-tight bg-primary text-primary-foreground shadow-soft ${sz}`}
    >
      <Heart className={`${icon} fill-current`} />
      {score}%
    </span>
  );
}
