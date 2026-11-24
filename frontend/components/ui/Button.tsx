import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Spinner } from "@/components/ui/Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-orange text-white shadow-sm hover:bg-orange-dark hover:shadow focus-visible:ring-2 focus-visible:ring-orange/30",
  secondary:
    "border-2 border-ink/80 text-ink bg-transparent hover:bg-ink hover:text-cream focus-visible:ring-2 focus-visible:ring-ink/20",
  ghost:
    "text-orange-dark hover:bg-orange/10 focus-visible:ring-2 focus-visible:ring-orange/20",
  gold:
    "bg-copper text-charcoal shadow-sm hover:bg-copper-dark hover:text-white focus-visible:ring-2 focus-visible:ring-copper/30",
  "outline-light":
    "border-2 border-cream/80 text-cream bg-transparent hover:bg-cream hover:text-charcoal focus-visible:ring-2 focus-visible:ring-cream/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-12 px-7 text-lg",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return clsx(base, variantStyles[variant], sizeStyles[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner decorative />}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...rest} />;
}
