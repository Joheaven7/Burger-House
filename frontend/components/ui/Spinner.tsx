import clsx from "clsx";
import { messages } from "@/messages/en";

interface SpinnerProps {
  label?: string;
  decorative?: boolean;
  className?: string;
}

export function Spinner({ label = messages.common.loading, decorative = false, className }: SpinnerProps) {
  const icon = (
    <svg
      className={clsx("h-5 w-5 animate-spin motion-reduce:animate-none", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  if (decorative) return icon;

  return (
    <span role="status" className="inline-flex items-center gap-2">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}