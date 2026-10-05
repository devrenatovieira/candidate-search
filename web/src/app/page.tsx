import { SearchBox } from "@/components/search-box";
import { LogoMark } from "@/components/brand/logo";
import { TopSuppliers } from "@/components/top-suppliers";
import { PageHeader } from "@/components/shell/shell-context";
import { YearSelect } from "@/components/ui/year-select";
import { getHomeStats } from "@/lib/stats";
import { getExpenseYears } from "@/lib/queries";
import { formatBRL, formatBRLCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const anoParam = typeof sp.ano === "string" ? Number(sp.ano) : NaN;
  const expenseYears = getExpenseYears();
  const year = Number.isInteger(anoParam) && expenseYears.includes(anoParam) ? anoParam : undefined;

  const stats = getHomeStats(year);

  const heroStats = [
    { label: "pessoas", value: stats.people.toLocaleString("pt-BR") },
    { label: "candidaturas", value: stats.candidacies.toLocaleString("pt-BR") },
    {
      label: "doações recebidas",
      value: formatBRLCompact(stats.donationsTotalCents),
      exact: formatBRL(stats.donationsTotalCents),
      tone: "green" as const,
    },
    {
      label: "despesas contratadas",
      value: formatBRLCompact(stats.expensesTotalCents),
      exact: formatBRL(stats.expensesTotalCents),
    },
    { label: year ? "eleição" : "período coberto", value: stats.years },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        group="Candidate Search"
        current="Início"
        actions={<YearSelect basePath="/" years={expenseYears} value={year} allLabel="todos os anos" />}
      />

      <section className="hero animate-in" aria-labelledby="hero-title">
        <LogoMark className="hero__mark" size={340} />
        <div className="relative">
          <h1 id="hero-title" className="hero__title">
            Consulte a ficha pública de qualquer candidato brasileiro
          </h1>
          <p className="hero__lede">
            Candidaturas, doações, despesas de campanha e bens declarados de 2014 a 2026, organizados por
            pessoa. Cada número mostra de qual arquivo oficial saiu e o hash que comprova que não foi
            alterado.
          </p>
          <div className="mt-8">
            <SearchBox />
          </div>
          <p className="hero__sources">
            Fontes: Tribunal Superior Eleitoral, Receita Federal e Portal da Transparência.
          </p>
        </div>
      </section>

      <section className="animate-in flex flex-col gap-3" style={{ animationDelay: "60ms" }} aria-label="Números da base">
        <h2 className="section-title">{year ? `A base em ${year}` : "A base em números"}</h2>
        <div className="kpis">
          {heroStats.map((s) => (
            <div key={s.label} className="kpi">
              <div className="kpi__label">{s.label}</div>
              <div
                className={`kpi__value${"tone" in s && s.tone === "green" ? " kpi__value--green" : ""}`}
                title={"exact" in s ? s.exact : undefined}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="animate-in" style={{ animationDelay: "120ms" }}>
        <TopSuppliers years={expenseYears} initialYear={year} />
      </div>

      <aside className="signal signal--medium animate-in max-w-3xl" style={{ animationDelay: "180ms" }}>
        <div className="label mb-2">Indício não é prova</div>
        <p className="text-[14px] leading-relaxed text-[var(--fg-2)]">
          O Candidate Search reúne dados que já são públicos por lei (registro de candidatura do TSE,
          prestação de contas eleitorais, redes sociais declaradas) e os organiza por pessoa. Nada aqui é
          acusação: é o dado oficial, com a fonte exposta em cada campo, para que qualquer pessoa confira e
          aprofunde a apuração.
        </p>
      </aside>
    </div>
  );
}
