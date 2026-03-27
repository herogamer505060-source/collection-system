import Link from "next/link";

type QueryPaginationProps = {
  currentPage: number;
  pageSize: number;
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  totalCount: number;
};

export function QueryPagination({
  currentPage,
  pageSize,
  pathname,
  searchParams = {},
  totalCount,
}: QueryPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface-variant ambient-shadow">
      <div>
        صفحة {currentPage} من {totalPages}
      </div>
      <div className="flex gap-3">
        <PaginationLink
          currentPage={currentPage}
          disabled={currentPage <= 1}
          direction="prev"
          pageSize={pageSize}
          pathname={pathname}
          searchParams={searchParams}
        />
        <PaginationLink
          currentPage={currentPage}
          disabled={currentPage >= totalPages}
          direction="next"
          pageSize={pageSize}
          pathname={pathname}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}

function PaginationLink({
  currentPage,
  direction,
  disabled,
  pageSize,
  pathname,
  searchParams,
}: {
  currentPage: number;
  direction: "next" | "prev";
  disabled: boolean;
  pageSize: number;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (disabled) {
    return (
      <span className="rounded-xl bg-surface-container-low px-4 py-2 text-label-lg text-on-surface-variant/60">
        {direction === "prev" ? "السابق" : "التالي"}
      </span>
    );
  }

  const nextPage = direction === "prev" ? currentPage - 1 : currentPage + 1;
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === "page") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => nextSearchParams.append(key, entry));
      continue;
    }

    nextSearchParams.set(key, value);
  }

  nextSearchParams.set("page", String(nextPage));
  nextSearchParams.set("pageSize", String(pageSize));

  return (
    <Link
      className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg font-semibold text-on-surface transition-all hover:bg-surface-container-highest"
      href={`${pathname}?${nextSearchParams.toString()}`}
    >
      {direction === "prev" ? "السابق" : "التالي"}
    </Link>
  );
}
