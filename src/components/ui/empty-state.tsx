import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-border py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-content-tertiary" aria-hidden />
      <h3 className="text-sm font-semibold text-content-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-content-secondary">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
