import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<TData> = {
  cell: (row: TData) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
};

type DataTableProps<TData> = {
  caption?: ReactNode;
  className?: string;
  columns: DataTableColumn<TData>[];
  data: TData[];
  emptyState?: ReactNode;
  expandedContent?: (row: TData) => ReactNode;
  expandedRowId?: string | null;
  getRowId: (row: TData, index: number) => string;
};

export function DataTable<TData>({
  caption,
  className,
  columns,
  data,
  emptyState,
  expandedContent,
  expandedRowId,
  getRowId,
}: DataTableProps<TData>) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-surface-container-lowest ambient-shadow", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-body-md">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              {columns.map((column, index) => (
                <th
                  className={cn("px-4 py-3 text-right text-label-lg font-semibold", column.headerClassName)}
                  key={`header-${index}`}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/[0.15]">
            {data.length > 0 ? (
              data.map((row, index) => {
                const rowId = getRowId(row, index);
                const isExpanded = expandedRowId === rowId;
                return (
                  <Fragment key={rowId}>
                    <tr className="align-top">
                      {columns.map((column, columnIndex) => (
                        <td className={cn("px-4 py-4 text-on-surface", column.className)} key={columnIndex}>
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && expandedContent ? (
                      <tr>
                        <td className="p-0" colSpan={columns.length}>
                          {expandedContent(row)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-on-surface-variant" colSpan={columns.length}>
                  {emptyState ?? "لا توجد بيانات حاليا"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
