import clsx from "clsx";
import type { SelectHTMLAttributes } from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // read by screen readers
  disabled?: boolean;
}

/** An on/off switch. The state is also exposed as text for assistive technology (role="switch"). */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-orange bg-orange" : "border-ink/40 bg-ink/10",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-7" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  tone?: "light" | "dark";
}

export function Select({ id, label, hint, error, tone = "light", className, children, ...rest }: SelectProps) {
  const isDark = tone === "dark";
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={clsx("block text-sm font-semibold tracking-wide", isDark ? "text-cream" : "text-ink")}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={clsx("text-sm", isDark ? "text-muted-dark" : "text-muted")}>
          {hint}
        </p>
      )}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          "min-h-11 w-full rounded-control border px-3 py-2 text-base transition-colors duration-150 outline-none",
          isDark
            ? "border-cream/20 bg-surface-dark text-cream focus:border-copper focus:ring-2 focus:ring-copper/20"
            : "border-ink/20 bg-surface text-ink focus:border-orange focus:ring-2 focus:ring-orange/20",
          error && "border-orange-dark focus:border-orange-dark focus:ring-orange/30",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-orange-dark">
          {error}
        </p>
      )}
    </div>
  );
}
