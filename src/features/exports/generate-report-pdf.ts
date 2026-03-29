import type { ExportColumn, ExportType } from "@/features/exports/column-definitions";
import {
  formatNumericTotal,
  getNumericColumnTotals,
  hasAnyNumericTotals,
} from "@/features/exports/report-table-totals";

type ReportPdfDataset = {
  columns: ExportColumn[];
  fileNameBase: string;
  filterSummary: Array<{ label: string; value: string }>;
  generatedAt: string;
  rows: Record<string, unknown>[];
  title: string;
  type: ExportType;
};

type PageShellInput = {
  columns: ExportColumn[];
  filterSummary: Array<{ label: string; value: string }>;
  generatedAt: string;
  isLastPage: boolean;
  pageNumber: number;
  title: string;
  totalPages: number;
  totalRows: number;
  totals: Record<string, number | null>;
};

const PAGE_HEIGHT = 794;
const PAGE_PADDING = 22;
const PAGE_WIDTH = 1123;
const TABLE_FONT_SIZE = 11;
const ARABIC_FONT_STACK = 'var(--font-ibm-plex-arabic), "IBM Plex Sans Arabic", Tahoma, "Segoe UI", Arial, sans-serif';

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
  mount.style.fontFamily = ARABIC_FONT_STACK;
  mount.style.letterSpacing = "0";
  mount.style.lineHeight = "1.6";
  mount.style.direction = "rtl";

  document.body.appendChild(mount);

  try {
    if ("fonts" in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    await waitForNextPaint();

    const totals = getNumericColumnTotals(dataset.columns, dataset.rows);
    const rowChunks = dataset.rows.length > 0 ? measureRowChunks(dataset, mount, totals) : [[]];
    const totalPages = Math.max(rowChunks.length, 1);

    mount.replaceChildren();

    rowChunks.forEach((rows, index) => {
      mount.appendChild(
        buildPageElement(
          {
            columns: dataset.columns,
            filterSummary: dataset.filterSummary,
            generatedAt: dataset.generatedAt,
            isLastPage: index === totalPages - 1,
            pageNumber: index + 1,
            title: dataset.title,
            totalPages,
            totalRows: dataset.rows.length,
            totals,
          },
          rows,
        ),
      );
    });

    if (rowChunks.length === 0) {
      mount.appendChild(
        buildPageElement(
          {
            columns: dataset.columns,
            filterSummary: dataset.filterSummary,
            generatedAt: dataset.generatedAt,
            isLastPage: true,
            pageNumber: 1,
            title: dataset.title,
            totalPages: 1,
            totalRows: 0,
            totals,
          },
          [],
        ),
      );
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

function measureRowChunks(
  dataset: ReportPdfDataset,
  mount: HTMLElement,
  totals: Record<string, number | null>,
): Record<string, unknown>[][] {
  const measurement = buildPageShell({
    columns: dataset.columns,
    filterSummary: dataset.filterSummary,
    generatedAt: dataset.generatedAt,
    isLastPage: false,
    pageNumber: 1,
    title: dataset.title,
    totalPages: 1,
    totalRows: dataset.rows.length,
    totals,
  });

  measurement.page.style.visibility = "hidden";
  mount.appendChild(measurement.page);

  const chunks: Record<string, unknown>[][] = [];
  let currentChunk: Record<string, unknown>[] = [];

  dataset.rows.forEach((row) => {
    const rowElement = createRowElement(row, dataset.columns, currentChunk.length);
    measurement.tbody.appendChild(rowElement);

    if (measurement.tableWrap.scrollHeight > measurement.tableWrap.clientHeight && currentChunk.length > 0) {
      measurement.tbody.removeChild(rowElement);
      chunks.push(currentChunk);
      currentChunk = [];
      measurement.tbody.replaceChildren();
      measurement.tbody.appendChild(createRowElement(row, dataset.columns, 0));
    }

    currentChunk.push(row);
  });

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  if (hasAnyNumericTotals(totals) && chunks.length > 0) {
    const lastChunk = [...(chunks[chunks.length - 1] ?? [])];
    measurement.tbody.replaceChildren();
    lastChunk.forEach((row, rowIndex) => {
      measurement.tbody.appendChild(createRowElement(row, dataset.columns, rowIndex));
    });
    measurement.tbody.appendChild(createTotalsRow(dataset.columns, totals));

    if (measurement.tableWrap.scrollHeight > measurement.tableWrap.clientHeight && lastChunk.length > 0) {
      const overflowRow = lastChunk.pop();

      if (overflowRow) {
        chunks[chunks.length - 1] = lastChunk;
        chunks.push([overflowRow]);
      }
    }
  }

  measurement.page.remove();
  return chunks;
}

function buildPageElement(input: PageShellInput, rows: Record<string, unknown>[]): HTMLElement {
  const shell = buildPageShell(input);

  if (rows.length > 0) {
    rows.forEach((row, rowIndex) => {
      shell.tbody.appendChild(createRowElement(row, input.columns, rowIndex));
    });
  } else {
    const tr = document.createElement("tr");
    const td = createTextElement("td", "لا توجد بيانات ضمن هذا النطاق", {
      color: "#475569",
      direction: "rtl",
      fontFamily: ARABIC_FONT_STACK,
      fontSize: "13px",
      letterSpacing: "0",
      padding: "16px 12px",
      textAlign: "center",
    });
    td.colSpan = input.columns.length;
    tr.appendChild(td);
    shell.tbody.appendChild(tr);
  }

  if (input.isLastPage && hasAnyNumericTotals(input.totals)) {
    shell.tbody.appendChild(createTotalsRow(input.columns, input.totals));
  }

  return shell.page;
}

function buildPageShell(input: PageShellInput) {
  const page = createElement("section", {
    background: "#ffffff",
    boxSizing: "border-box",
    direction: "rtl",
    display: "flex",
    flexDirection: "column",
    fontFamily: ARABIC_FONT_STACK,
    gap: "10px",
    height: `${PAGE_HEIGHT}px`,
    overflow: "hidden",
    padding: `${PAGE_PADDING}px`,
    width: `${PAGE_WIDTH}px`,
  });
  page.dataset.reportPage = "true";

  const header = createElement("div", {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  });
  const headerTop = createElement("div", {
    alignItems: "flex-start",
    display: "flex",
    gap: "16px",
    justifyContent: "space-between",
  });
  const titleWrap = createElement("div", {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  });
  const title = createTextElement("h1", input.title, {
    color: "#0f172a",
    fontFamily: ARABIC_FONT_STACK,
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "0",
    lineHeight: "1.45",
    margin: "0",
    wordBreak: "normal",
  });
  const subtitle = createTextElement(
    "p",
    `عدد الصفوف: ${input.totalRows} - الصفحة ${input.pageNumber} من ${input.totalPages}`,
    {
      color: "#475569",
      fontFamily: ARABIC_FONT_STACK,
      fontSize: "12px",
      letterSpacing: "0",
      lineHeight: "1.5",
      margin: "0",
    },
  );
  const generatedAt = createTextElement("div", `تاريخ الإنشاء: ${input.generatedAt}`, {
    color: "#475569",
    direction: "rtl",
    fontFamily: ARABIC_FONT_STACK,
      fontSize: "12px",
    letterSpacing: "0",
    lineHeight: "1.5",
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
      gap: "6px",
    });

    input.filterSummary.forEach((entry) => {
      const pill = createElement("div", {
        alignItems: "center",
        background: "#eef3f2",
        border: "1px solid rgba(188, 201, 200, 0.8)",
        borderRadius: "999px",
        color: "#234043",
        direction: "rtl",
        display: "inline-flex",
        fontFamily: ARABIC_FONT_STACK,
        fontSize: "11px",
        gap: "4px",
        padding: "4px 9px",
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
    borderRadius: "16px",
    flex: "1 1 auto",
    overflow: "hidden",
  });
  const table = createElement("table", {
    borderCollapse: "collapse",
    tableLayout: "fixed",
    width: "100%",
  });
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const totalColumnWeight = input.columns.reduce((sum, column) => sum + Math.max(column.width ?? 16, 12), 0);

  input.columns.forEach((column) => {
    const widthPercent = `${(Math.max(column.width ?? 16, 12) / totalColumnWeight) * 100}%`;
    const cell = createTextElement("th", column.header, {
      background: "#eef3f2",
      borderBottom: "1px solid #dbe4e3",
      color: "#334155",
      direction: "rtl",
      fontFamily: ARABIC_FONT_STACK,
      fontSize: `${TABLE_FONT_SIZE}px`,
      fontWeight: "700",
      letterSpacing: "0",
      lineHeight: "1.45",
      padding: "7px 6px",
      textAlign: "right",
      verticalAlign: "top",
      whiteSpace: "normal",
      width: widthPercent,
      wordBreak: "normal",
      overflowWrap: "anywhere",
    });
    headRow.appendChild(cell);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  const footer = createTextElement("div", "Collection System - Executive Report", {
    color: "#64748b",
    fontFamily: ARABIC_FONT_STACK,
    fontSize: "11px",
    letterSpacing: "0",
    marginTop: "auto",
    textAlign: "center",
  });

  page.append(header, tableWrap, footer);
  return { page, tableWrap, tbody };
}

function createTotalsRow(
  columns: ExportColumn[],
  totals: Record<string, number | null>,
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.style.background = "#edf4f3";

  columns.forEach((column, index) => {
    const text = index === 0 ? "الإجمالي" : formatNumericTotal(totals[column.key] ?? null);
    const cell = createTextElement("td", text, {
      borderBottom: "1px solid #dbe4e3",
      color: index === 0 ? "#0f172a" : "#14383b",
      direction: "rtl",
      fontFamily: ARABIC_FONT_STACK,
      fontSize: `${TABLE_FONT_SIZE}px`,
      fontWeight: "700",
      letterSpacing: "0",
      lineHeight: "1.45",
      padding: "7px 6px",
      textAlign: index === 0 ? "right" : "center",
      verticalAlign: "top",
    });
    tr.appendChild(cell);
  });

  return tr;
}

function createRowElement(
  row: Record<string, unknown>,
  columns: ExportColumn[],
  rowIndex: number,
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.style.background = rowIndex % 2 === 0 ? "#ffffff" : "#fafbfb";

  columns.forEach((column) => {
    const cell = createTextElement("td", formatCellValue(row[column.key]), {
      borderBottom: "1px solid #edf2f1",
      color: "#0f172a",
      direction: "rtl",
      fontFamily: ARABIC_FONT_STACK,
      fontSize: `${TABLE_FONT_SIZE}px`,
      letterSpacing: "0",
      lineHeight: "1.5",
      padding: "6px 6px",
      textAlign: "right",
      verticalAlign: "top",
      whiteSpace: "normal",
      wordBreak: "normal",
      overflowWrap: "anywhere",
    });
    tr.appendChild(cell);
  });

  return tr;
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

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
