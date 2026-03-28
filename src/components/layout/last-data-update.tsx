import { formatEgyptDateTime } from "@/lib/dates/egypt";

type LastDataUpdateProps = {
  lastImportAt: string | null;
};

export function LastDataUpdate({ lastImportAt }: LastDataUpdateProps) {
  return (
    <div className="rounded-[24px] border border-[rgba(188,201,200,0.5)] bg-[rgba(247,249,248,0.92)] px-4 py-3 text-body-md text-on-surface-variant">
      <div className="text-label-lg uppercase tracking-[0.16em] text-primary/65">آخر تحديث للبيانات</div>
      <div className="mt-2 font-semibold text-on-surface">{lastImportAt ? formatEgyptDateTime(lastImportAt) : "لا توجد عملية استيراد معتمدة بعد"}</div>
    </div>
  );
}
