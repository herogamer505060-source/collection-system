type DateRangeInputsProps = {
  endDateValue?: string | null;
  startDateValue?: string | null;
};

const inputClassName =
  "rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-[#8ad3d7]/30";

export function DateRangeInputs({ endDateValue, startDateValue }: DateRangeInputsProps) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-label-md text-on-surface-variant" htmlFor="startDate">
          من تاريخ
        </label>
        <input
          className={inputClassName}
          defaultValue={startDateValue ?? ""}
          id="startDate"
          name="startDate"
          type="date"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-label-md text-on-surface-variant" htmlFor="endDate">
          إلى تاريخ
        </label>
        <input
          className={inputClassName}
          defaultValue={endDateValue ?? ""}
          id="endDate"
          name="endDate"
          type="date"
        />
      </div>
    </>
  );
}
