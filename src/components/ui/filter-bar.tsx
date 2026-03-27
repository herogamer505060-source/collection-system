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
    <section className={cn("filter-bar rounded-2xl bg-surface-container-lowest p-5 ambient-shadow", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-title-lg text-on-surface">{title}</h2>
          {description ? <p className="mt-2 text-body-md text-on-surface-variant">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
