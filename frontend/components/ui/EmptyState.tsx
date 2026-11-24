import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-card border border-ink/10 bg-surface p-8 text-center">
      <h2 className="font-display text-2xl font-bold uppercase text-ink">{title}</h2>
      {description && <p className="text-muted">{description}</p>}
      {action}
    </div>
  );
}