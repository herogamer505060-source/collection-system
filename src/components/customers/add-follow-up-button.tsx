"use client";

import { useState } from "react";

import { FollowUpForm } from "@/components/follow-ups/follow-up-form";

type AddFollowUpButtonProps = {
  canManage: boolean;
  contractOptions: Array<{ id: string; label: string }>;
  customerId: string;
  customerLabel: string;
  defaultCollectorUserId?: string | null;
};

export function AddFollowUpButton({
  canManage,
  contractOptions,
  customerId,
  customerLabel,
  defaultCollectorUserId,
}: AddFollowUpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {isOpen ? (
        <FollowUpForm
          contractOptions={contractOptions}
          customerId={customerId}
          customerLabel={customerLabel}
          defaultCollectorUserId={defaultCollectorUserId}
          mode="create"
          onCancel={() => setIsOpen(false)}
          onSuccess={() => setIsOpen(false)}
          title="إضافة متابعة جديدة"
        />
      ) : (
        <button
          className="gradient-primary rounded-xl px-4 py-3 text-body-md font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          إضافة متابعة
        </button>
      )}
    </div>
  );
}
