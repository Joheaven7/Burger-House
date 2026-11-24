import clsx from "clsx";
import type { ReactNode } from "react";

export type ContainerWidth = "narrow" | "standard" | "wide" | "full";

const widthStyles: Record<ContainerWidth, string> = {
  narrow: "max-w-4xl",
  standard: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  children,
  width = "standard",
  className,
}: {
  children: ReactNode;
  width?: ContainerWidth;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full px-4 sm:px-6 lg:px-8", widthStyles[width], className)}>
      {children}
    </div>
  );
}
