import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export function FilterBar({ actions, children, className, description, title }: FilterBarProps) {
  return (
    <section className={cn("filter-bar executive-panel relative rounded-[30px] p-5 sm:p-6", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 text-label-lg uppercase tracking-[0.2em] text-primary/65">Control center</div>
          <h2 className="font-display text-title-lg text-[hsl(var(--premium-ink))] sm:text-headline-sm">{title}</h2>
          {description ? <p className="mt-2 text-body-md leading-7 text-on-surface-variant">{description}</p> : null}
        </div>
        {actions ? <div className="relative flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="relative mt-5 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
