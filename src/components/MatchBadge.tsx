export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const tone =
    score >= 85 ? "bg-success text-success-foreground"
    : score >= 70 ? "bg-primary text-primary-foreground"
    : score >= 50 ? "bg-ochre text-foreground"
    : "bg-muted text-muted-foreground";
  const sz = size === "lg" ? "px-3 py-1.5 text-sm" : size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${tone} ${sz} shadow-soft`}>
      {score}% Match
    </span>
  );
}
