import Link from "next/link";

type UnitRowActionsProps = {
  linkedContract: null | {
    contractCode: string | null;
    contractId: string;
  };
};

export function UnitRowActions({ linkedContract }: UnitRowActionsProps) {
  if (!linkedContract) {
    return <span className="text-label-lg text-on-surface-variant">لا يوجد عقد مرتبط</span>;
  }

  return (
    <Link
      className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
      href={`/contracts/${linkedContract.contractId}`}
    >
      {linkedContract.contractCode ?? `فتح العقد ${linkedContract.contractId.slice(0, 8)}`}
    </Link>
  );
}
