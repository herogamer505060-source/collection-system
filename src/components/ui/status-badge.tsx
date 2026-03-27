import type { ReactNode } from "react";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-label-lg font-semibold",
  {
    defaultVariants: {
      variant: "neutral",
    },
    variants: {
      variant: {
        danger: "bg-error-container text-[#93000a]",
        info: "bg-[#cfe6f2] text-[#071e27]",
        neutral: "bg-surface-container-high text-on-surface-variant",
        success: "bg-[#d0f5f5] text-[#004f4f]",
        warning: "bg-[#fff3e0] text-[#7a4100]",
      },
    },
  },
);

type StatusBadgeProps = {
  children: ReactNode;
  className?: string;
  variant?: "danger" | "info" | "neutral" | "success" | "warning";
};

export function StatusBadge({ children, className, variant }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)}>{children}</span>;
}
