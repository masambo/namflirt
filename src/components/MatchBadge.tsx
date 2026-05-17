export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "px-3 py-1.5 text-sm" : size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold bg-primary text-primary-foreground ${sz} shadow-soft`}>
      Match {score}%
    </span>
  );
}
