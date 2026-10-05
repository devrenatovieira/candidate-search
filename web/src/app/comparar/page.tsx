import Link from "next/link";
import type { ReactNode } from "react";
import {
  getPersonAssets,
  getPersonCandidacies,
  getPersonFinance,
  getPersonHeader,
  getPersonPhotoUrl,
} from "@/lib/queries";
import { formatBRL, resultTone } from "@/lib/format";
import { COMPARE_MAX } from "@/lib/saved-keys";
import { PageHeader } from "@/components/shell/shell-context";
import { SearchAvatar } from "@/components/search-avatar";
import { CompareAdd, CompareRemove, CompareSync } from "@/components/compare/compare-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comparar candidatos" };

type Column = {
  personId: number;
  name: string;
  sub: string;
  photoUrl: string | null;
  candidacyCount: number;
  electedCount: number;
  signalsCount: number;
  donationsCents: number;
  donationsCount: number;
  fundCents: number;
  expensesCents: number;
  paymentsCents: number;
  latestAssets: { year: number; totalCents: number } | null;
  firstAssets: { year: number; totalCents: number } | null;
  history: Array<{ year: number; office: string | null; result: string | null }>;
};

function parseIds(raw: string | string[] | undefined): number[] {
  const value = Array.isArray(raw) ? raw.join(",") : raw ?? "";
  const ids = value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, COMPARE_MAX);
}

function loadColumn(personId: number): Column | null {
  const header = getPersonHeader(personId);
  if (!header) return null;
  const finance = getPersonFinance(personId);
  const { declaredAssetsByYear } = getPersonAssets(personId);
  const candidacies = getPersonCandidacies(personId);
  const byYear = [...declaredAssetsByYear].sort((a, b) => a.year - b.year);
  const latest = header.latestCandidacy;

  return {
    personId,
    name: header.person.canonicalName ?? "(nome indisponível)",
    sub: latest
      ? [latest.office, [latest.partyAbbr, latest.state].filter(Boolean).join("/"), latest.year].filter(Boolean).join(" · ")
      : "candidato",
    photoUrl: getPersonPhotoUrl(personId),
    candidacyCount: header.candidacyCount,
    electedCount: candidacies.filter((c) => resultTone(c.result) === "green").length,
    signalsCount: header.signalsCount,
    donationsCents: finance.donationsTotalCents,
    donationsCount: finance.donationsCount,
    fundCents: finance.electoralFundTotalCents,
    expensesCents: finance.expensesTotalCents,
    paymentsCents: finance.paymentsTotalCents,
    latestAssets: byYear.at(-1) ?? null,
    firstAssets: byYear.length > 1 ? byYear[0] : null,
    history: candidacies.map((c) => ({ year: c.year, office: c.office, result: c.result })),
  };
}

export default async function CompararPage({ searchParams }: PageProps<"/comparar">) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids);
  const columns = ids.map(loadColumn).filter((c): c is Column => c !== null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Candidate Search" current="Comparar candidatos" />
      <CompareSync entities={columns.map((c) => ({ href: `/politico/${c.personId}`, label: c.name, sub: c.sub }))} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">Comparar candidatos</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">
            Até {COMPARE_MAX} candidatos lado a lado, somando todas as eleições disputadas. As barras mostram a proporção
            em relação ao maior valor da linha. Diferença de valores não é indício por si só.
          </p>
        </div>
        {columns.length < COMPARE_MAX ? <CompareAdd /> : null}
      </div>

      {columns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">
            Nenhum candidato na comparação. Use “Adicionar candidato” acima ou o botão Comparar em qualquer ficha.
          </div>
        </div>
      ) : (
        <div className="compare animate-in" style={{ ["--cols" as string]: columns.length }}>
          <div className="compare__row compare__row--head">
            <div className="compare__label" />
            {columns.map((c) => (
              <div key={c.personId} className="compare__cell compare__person">
                <SearchAvatar photoUrl={c.photoUrl} name={c.name} />
                <div className="min-w-0 flex-1">
                  <Link href={`/politico/${c.personId}`} className="compare__name">
                    {c.name}
                  </Link>
                  <div className="compare__sub">{c.sub}</div>
                </div>
                <CompareRemove href={`/politico/${c.personId}`} ids={columns.map((x) => x.personId)} personId={c.personId} />
              </div>
            ))}
          </div>

          <MetricRow label="Candidaturas" columns={columns} value={(c) => c.candidacyCount} render={(c) => (
            <>
              {c.candidacyCount.toLocaleString("pt-BR")}
              <span className="compare__note">
                {c.electedCount > 0 ? `${c.electedCount} eleito${c.electedCount > 1 ? "s" : ""}` : "nenhuma eleição vencida"}
              </span>
            </>
          )} />
          <MetricRow label="Doações recebidas" tone="green" columns={columns} value={(c) => c.donationsCents} render={(c) => (
            <>
              {formatBRL(c.donationsCents)}
              <span className="compare__note">{c.donationsCount.toLocaleString("pt-BR")} doações</span>
            </>
          )} />
          <MetricRow label="Fundo eleitoral e partidário" columns={columns} value={(c) => c.fundCents} render={(c) => formatBRL(c.fundCents)} />
          <MetricRow label="Despesas contratadas" columns={columns} value={(c) => c.expensesCents} render={(c) => formatBRL(c.expensesCents)} />
          <MetricRow label="Pago (regime de caixa)" columns={columns} value={(c) => c.paymentsCents} render={(c) => formatBRL(c.paymentsCents)} />
          <MetricRow label="Patrimônio declarado" columns={columns} value={(c) => c.latestAssets?.totalCents ?? 0} render={(c) =>
            c.latestAssets ? (
              <>
                {formatBRL(c.latestAssets.totalCents)}
                <span className="compare__note">
                  em {c.latestAssets.year}
                  {c.firstAssets ? <AssetsGrowth first={c.firstAssets} last={c.latestAssets} /> : null}
                </span>
              </>
            ) : (
              <span className="text-[var(--muted-2)]">sem declaração</span>
            )
          } />
          <MetricRow label="Sinais de alerta" tone="red" columns={columns} value={(c) => c.signalsCount} render={(c) => (
            <Link href={`/politico/${c.personId}#sinais`} className={c.signalsCount > 0 ? "text-signal-red" : undefined}>
              {c.signalsCount.toLocaleString("pt-BR")}
            </Link>
          )} />

          <div className="compare__row">
            <div className="compare__label">Histórico</div>
            {columns.map((c) => (
              <div key={c.personId} className="compare__cell">
                <ul className="compare__history">
                  {c.history.map((h, i) => {
                    const tone = resultTone(h.result);
                    return (
                      <li key={`${h.year}-${i}`}>
                        <span className="num">{h.year}</span>
                        <span className="min-w-0 flex-1 truncate">{h.office ?? "cargo n/d"}</span>
                        {h.result ? (
                          <span className={`badge ${tone === "green" ? "badge--green" : tone === "red" ? "badge--red" : ""}`}>
                            {h.result.toLowerCase()}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, columns, value, render, tone }: {
  label: string;
  columns: Column[];
  value: (c: Column) => number;
  render: (c: Column) => ReactNode;
  tone?: "green" | "red";
}) {
  const max = Math.max(...columns.map(value), 0);
  return (
    <div className="compare__row">
      <div className="compare__label">{label}</div>
      {columns.map((c) => {
        const v = value(c);
        return (
          <div key={c.personId} className="compare__cell">
            <div className="compare__value">{render(c)}</div>
            <div className="compare__bar" aria-hidden>
              <span
                className={tone ? `compare__fill compare__fill--${tone}` : "compare__fill"}
                style={{ width: max > 0 ? `${Math.max(v > 0 ? 3 : 0, (v / max) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetsGrowth({ first, last }: { first: { year: number; totalCents: number }; last: { year: number; totalCents: number } }) {
  if (first.totalCents <= 0) return null;
  const pct = ((last.totalCents - first.totalCents) / first.totalCents) * 100;
  return (
    <>
      {" · "}
      <span className={pct >= 0 ? "text-signal-green" : "text-signal-red"}>
        {pct >= 0 ? "+" : ""}
        {pct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% desde {first.year}
      </span>
    </>
  );
}
