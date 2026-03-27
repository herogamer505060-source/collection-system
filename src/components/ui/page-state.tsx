import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageStateProps = {
  action?: ReactNode;
  className?: string;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  message: ReactNode;
  title: ReactNode;
};

export function PageState({ action, className, eyebrow, icon, message, title }: PageStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-[320px] items-center justify-center rounded-2xl bg-surface-container-lowest p-8 text-center ambient-shadow",
        className,
      )}
    >
      <div className="max-w-xl space-y-4">
        {eyebrow ? <div className="text-label-lg font-semibold uppercase tracking-[0.24em] text-primary/70">{eyebrow}</div> : null}
        {icon ? <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-headline-sm text-primary">{icon}</div> : null}
        <h2 className="font-display text-headline-sm font-bold text-on-surface">{title}</h2>
        <p className="text-body-md leading-7 text-on-surface-variant">{message}</p>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </section>
  );
}

export function PageLoadingState() {
  return (
    <PageState
      eyebrow="Loading"
      icon="..."
      message="يتم تجهيز بيانات الصفحة وتجميع المؤشرات والنتائج اللازمة للعرض."
      title="جار تحميل مساحة العمل"
    />
  );
}

export function PageEmptyState({ action, message, title }: Omit<PageStateProps, "className" | "eyebrow" | "icon">) {
  return <PageState action={action} eyebrow="Empty" icon="-" message={message} title={title} />;
}

export function PageErrorState({ action, message, title }: Omit<PageStateProps, "className" | "eyebrow" | "icon">) {
  return <PageState action={action} eyebrow="Error" icon="!" message={message} title={title} />;
}
