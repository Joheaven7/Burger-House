import clsx from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  tone?: "light" | "dark";
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  tone = "light",
  children,
}: FieldProps & { children: React.ReactNode }) {
  const isDark = tone === "dark";
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={clsx("block text-sm font-semibold tracking-wide", isDark ? "text-cream" : "text-ink")}
      >
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={clsx("text-sm", isDark ? "text-muted-dark" : "text-muted")}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-orange-dark">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  id,
  label,
  hint,
  error,
  tone = "light",
  className,
  ...rest
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const isDark = tone === "dark";
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} tone={tone}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={clsx(
          "w-full rounded-control border px-4 py-2 text-base transition-colors duration-150 min-h-11 outline-none",
          isDark
            ? "border-cream/20 bg-surface-dark text-cream placeholder:text-muted-dark focus:border-copper focus:ring-2 focus:ring-copper/20"
            : "border-ink/20 bg-surface text-ink placeholder:text-muted focus:border-orange focus:ring-2 focus:ring-orange/20",
          error && "border-orange-dark focus:border-orange-dark focus:ring-orange/30",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
}

export function Textarea({
  id,
  label,
  hint,
  error,
  tone = "light",
  className,
  ...rest
}: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const isDark = tone === "dark";
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} tone={tone}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={clsx(
          "w-full rounded-control border px-4 py-2 text-base transition-colors duration-150 min-h-24 outline-none",
          isDark
            ? "border-cream/20 bg-surface-dark text-cream placeholder:text-muted-dark focus:border-copper focus:ring-2 focus:ring-copper/20"
            : "border-ink/20 bg-surface text-ink placeholder:text-muted focus:border-orange focus:ring-2 focus:ring-orange/20",
          error && "border-orange-dark focus:border-orange-dark focus:ring-orange/30",
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
}
