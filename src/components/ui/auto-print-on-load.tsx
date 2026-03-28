"use client";

import { useEffect } from "react";

type AutoPrintOnLoadProps = {
  enabled?: boolean;
};

export function AutoPrintOnLoad({ enabled = true }: AutoPrintOnLoadProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [enabled]);

  return null;
}
