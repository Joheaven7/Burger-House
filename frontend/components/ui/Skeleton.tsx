import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("animate-pulse rounded-control bg-ink/10 motion-reduce:animate-none", className)}
    />
  );
}