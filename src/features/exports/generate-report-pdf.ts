import type { ExportColumn, ExportType } from "@/features/exports/column-definitions";

type ReportPdfDataset = {
  columns: ExportColumn[];
  fileNameBase: string;
  filterSummary: Array<{ label: string; value: string }>;
  generatedAt: string;
  rows: Record<string, unknown>[];
  title: string;
  type: ExportType;
};

const PAGE_HEIGHT = 794;
const PAGE_PADDING = 36;
const PAGE_WIDTH = 1123;
const TABLE_FONT_SIZE = 12;

export async function generateReportPdf(dataset: ReportPdfDataset): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const mount = document.createElement("div");
  mount.setAttribute("dir", "rtl");
  mount.lang = "ar";
  mount.style.position = "fixed";
  mount.style.left = "-100000px";
  mount.style.top = "0";
  mount.style.zIndex = "-1";
  mount.style.width = `${PAGE_WIDTH}px`;
  mount.style.background = "#ffffff";
  mount.style.color = "#111827";
  mount.style.padding = "0";

  const rowsPerPage = getRowsPerPage(dataset.columns.length);
  const rowChunks = chunkRows(dataset.rows, rowsPerPage);
  const totalPages = Math.max(rowChunks.length, 1);

  rowChunks.forEach((rows, index) => {
    mount.appendChild(buildPageElement({
      columns: dataset.columns,
      filterSummary: dataset.filterSummary,
      generatedAt: dataset.generatedAt,
      pageNumber: index + 1,
      rows,
      title: dataset.title,
      totalPages,
      totalRows: dataset.rows.length,
    }));
  });

  if (rowChunks.length === 0) {
    mount.appendChild(
      buildPageElement({
        columns: dataset.columns,
        filterSummary: dataset.filterSummary,
        generatedAt: dataset.generatedAt,
        pageNumber: 1,
        rows: [],
        title: dataset.title,
        totalPages: 1,
        totalRows: 0,
      }),
    );
  }

  document.body.appendChild(mount);

  try {
    if ("fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    await waitForNextPaint();
    await waitForNextPaint();

    const pageElements = Array.from(mount.querySelectorAll<HTMLElement>("[data-report-page='true']"));
    const pdf = new jsPDF({
      compress: true,
      format: "a4",
      orientation: "landscape",
      unit: "mm",
    });

    for (let index = 0; index < pageElements.length; index += 1) {
      const canvas = await html2canvas(pageElements[index], {
        backgroundColor: "#ffffff",
        logging: false,
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage("a4", "landscape");
      }

      pdf.addImage(image, "PNG", 0, 0, 297, 210, undefined, "FAST");
    }

    pdf.save(`${dataset.fileNameBase}.pdf`);
  } finally {
    mount.remove();
  }
}

function buildPageElement(input: {
  columns: ExportColumn[];
  filterSummary: Array<{ label: string; value: string }>;
  generatedAt: string;
  pageNumber: number;
  rows: Record<string, unknown>[];
  title: string;
  totalPages: number;
  totalRows: number;
}): HTMLElement {
  const page = createElement("section", {
    background: "#ffffff",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    height: `${PAGE_HEIGHT}px`,
    justifyContent: "space-between",
    padding: `${PAGE_PADDING}px`,
    width: `${PAGE_WIDTH}px`,
  });
  page.dataset.reportPage = "true";

  const header = createElement("div", {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });
  const headerTop = createElement("div", {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  });
  const titleWrap = createElement("div", { display: "flex", flexDirection: "column", gap: "6px" });
  const title = createTextElement("h1", input.title, {
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    lineHeight: "1.3",
    margin: "0",
  });
  const subtitle = createTextElement(
    "p",
    `عدد الصفوف: ${input.totalRows} - الصفحة ${input.pageNumber} من ${input.totalPages}`,
    {
      color: "#475569",
      fontSize: "14px",
      margin: "0",
    },
  );
  const generatedAt = createTextElement("div", `تاريخ الإنشاء: ${input.generatedAt}`, {
    color: "#475569",
    fontSize: "14px",
    margin: "0",
    textAlign: "left",
  });

  titleWrap.append(title, subtitle);
  headerTop.append(titleWrap, generatedAt);
  header.appendChild(headerTop);

  if (input.filterSummary.length > 0) {
    const filtersWrap = createElement("div", {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    });

    input.filterSummary.forEach((entry) => {
      const pill = createElement("div", {
        alignItems: "center",
        background: "#eef3f2",
        border: "1px solid rgba(188, 201, 200, 0.8)",
        borderRadius: "999px",
        color: "#234043",
        display: "inline-flex",
        fontSize: "13px",
        gap: "6px",
        padding: "6px 12px",
      });
      const label = createTextElement("span", `${entry.label}:`, { fontWeight: "700" });
      const value = createTextElement("span", entry.value, {});
      pill.append(label, value);
      filtersWrap.appendChild(pill);
    });

    header.appendChild(filtersWrap);
  }

  const tableWrap = createElement("div", {
    border: "1px solid #dbe4e3",
    borderRadius: "18px",
    overflow: "hidden",
  });
  const table = createElement("table", {
    borderCollapse: "collapse",
    tableLayout: "fixed",
    width: "100%",
  });
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  input.columns.forEach((column) => {
    const cell = createTextElement("th", column.header, {
      background: "#eef3f2",
      borderBottom: "1px solid #dbe4e3",
      color: "#334155",
      fontSize: `${TABLE_FONT_SIZE}px`,
      fontWeight: "700",
      padding: "10px 8px",
      textAlign: "right",
      verticalAlign: "top",
      width: `${Math.max(column.width ?? 16, 12)}%`,
      wordBreak: "break-word",
    });
    headRow.appendChild(cell);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  if (input.rows.length > 0) {
    input.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.style.background = rowIndex % 2 === 0 ? "#ffffff" : "#fafbfb";

      input.columns.forEach((column) => {
        const cell = createTextElement("td", formatCellValue(row[column.key]), {
          borderBottom: "1px solid #edf2f1",
          color: "#0f172a",
          fontSize: `${TABLE_FONT_SIZE}px`,
          lineHeight: "1.7",
          padding: "10px 8px",
          textAlign: "right",
          verticalAlign: "top",
          wordBreak: "break-word",
        });
        tr.appendChild(cell);
      });

      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    const td = createTextElement("td", "لا توجد بيانات ضمن هذا النطاق", {
      color: "#475569",
      fontSize: "14px",
      padding: "18px",
      textAlign: "center",
    });
    td.colSpan = input.columns.length;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  const footer = createTextElement("div", "Collection System - Executive Report", {
    color: "#64748b",
    fontSize: "12px",
    textAlign: "center",
  });

  page.append(header, tableWrap, footer);
  return page;
}

function chunkRows(rows: Record<string, unknown>[], rowsPerPage: number) {
  const chunks: Record<string, unknown>[][] = [];

  for (let index = 0; index < rows.length; index += rowsPerPage) {
    chunks.push(rows.slice(index, index + rowsPerPage));
  }

  return chunks;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  style: Partial<CSSStyleDeclaration>,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  Object.assign(element.style, style);
  return element;
}

function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  style: Partial<CSSStyleDeclaration>,
): HTMLElementTagNameMap[K] {
  const element = createElement(tagName, style);
  element.textContent = text;
  return element;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatCellValue(item)).join("، ");
  }

  return String(value);
}

function getRowsPerPage(columnCount: number): number {
  if (columnCount >= 11) {
    return 12;
  }

  if (columnCount >= 9) {
    return 14;
  }

  if (columnCount >= 7) {
    return 16;
  }

  return 18;
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
