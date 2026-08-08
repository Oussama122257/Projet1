import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "gold",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "gold" | "navy" | "emerald";
}) {
  const accents = {
    gold: "bg-gold-100 text-gold-700",
    navy: "bg-navy-100 text-navy-700",
    emerald: "bg-emerald2-light text-emerald2",
  };
  return (
    <div className="glass card-enter flex items-center gap-4 p-5">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", accents[accent])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-black text-navy-700">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
