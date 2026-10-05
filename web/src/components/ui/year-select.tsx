"use client";

import { useProgressRouter } from "@/components/shell/navigation-progress";

export function YearSelect({
  basePath, years, value, allLabel = "todos",
}: {
  basePath: string;
  years: number[];
  value?: number;
  allLabel?: string;
}) {
  const router = useProgressRouter();
  if (years.length === 0) return null;

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const y = e.target.value;
        router.push(y ? `${basePath}?ano=${y}` : basePath);
      }}
      className="mono rounded-[var(--r-md)] border border-[var(--border-1)] bg-[var(--card-tone)] px-2.5 py-1.5 text-[12px] text-[var(--fg-1)] outline-none focus:border-[var(--border-2)]"
      aria-label="filtrar por ano"
    >
      <option value="">{allLabel}</option>
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}
