"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Cell text without avatars/buttons; stacked lines (name + cargo) are joined with " · ". */
function cellText(td: HTMLTableCellElement): string {
  const copy = td.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".search-avatar, button, svg, img").forEach((n) => n.remove());
  copy.querySelectorAll("div").forEach((d) => d.prepend(" · "));
  return clean(copy.textContent ?? "").replace(/(· )+/g, "· ").replace(/^· /, "");
}

function csvCell(s: string): string {
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Reads the visible rows of a rendered table. Expanded detail rows (different cell count) are skipped. */
function tableToCsv(table: HTMLTableElement): { csv: string; rows: number } {
  const header = [...table.querySelectorAll("thead th")].map((th) => clean(th.textContent ?? ""));
  const lines = [header];
  for (const tr of table.querySelectorAll<HTMLTableRowElement>("tbody > tr")) {
    const cells = [...tr.cells];
    if (header.length > 0 && cells.length !== header.length) continue;
    lines.push(cells.map(cellText));
  }
  // `;` + BOM: what Excel pt-BR opens correctly without an import wizard.
  return { csv: "\uFEFF" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n"), rows: lines.length - 1 };
}

/**
 * Toolbar placed as the first child of a `.table-wrap`. Exports the rows currently on screen
 * (the active page and filters) to CSV.
 */
export function TableTools({ filename, caption }: { filename: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const notify = useToast();

  function exportCsv() {
    const table = ref.current?.closest(".table-wrap")?.querySelector("table");
    if (!table) {
      notify("Tabela não encontrada", "error");
      return;
    }
    const { csv, rows } = tableToCsv(table);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`${rows.toLocaleString("pt-BR")} ${rows === 1 ? "linha exportada" : "linhas exportadas"}`);
  }

  return (
    <div ref={ref} className="table-tools print-hidden">
      {caption ? <span className="table-tools__caption">{caption}</span> : null}
      <button type="button" className="btn btn--sm" onClick={exportCsv} title="Exporta as linhas exibidas nesta página">
        <Download size={14} aria-hidden />
        Exportar CSV
      </button>
    </div>
  );
}
