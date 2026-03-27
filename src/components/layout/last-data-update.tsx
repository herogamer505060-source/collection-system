import { formatEgyptDateTime } from "@/lib/dates/egypt";

type LastDataUpdateProps = {
  lastImportAt: string | null;
};

export function LastDataUpdate({ lastImportAt }: LastDataUpdateProps) {
  return (
    <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
      <div className="font-semibold text-on-surface">آخر تحديث للبيانات</div>
      <div className="mt-1">{lastImportAt ? formatEgyptDateTime(lastImportAt) : "لا توجد عملية استيراد معتمدة بعد"}</div>
    </div>
  );
}
