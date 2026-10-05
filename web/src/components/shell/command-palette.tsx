"use client";

import { useEffect, useRef, useState } from "react";
import { useProgressRouter } from "@/components/shell/navigation-progress";
import type { SearchResult } from "@/lib/queries";
import { formatCpfCnpj } from "@/lib/format";
import { SearchAvatar } from "@/components/search-avatar";
import { History, Search, X } from "lucide-react";
import { RECENT_KEY, RECENT_MAX, useSavedList, type SavedEntity } from "@/lib/local-store";
import { useShell } from "./shell-context";

const SHORTCUTS = [
  { href: "/", label: "Início" },
  { href: "/grafo", label: "Grafo de correlações" },
  { href: "/comparar", label: "Comparar candidatos" },
  { href: "/ranking", label: "Bens declarados" },
  { href: "/sinais/doacao-circular", label: "Sinais · Doação circular" },
  { href: "/sinais/socio-fornecedor", label: "Sinais · Sócio de fornecedor" },
  { href: "/sinais/analise-ia", label: "Sinais · Análise de IA" },
  { href: "/sinais/discurso", label: "Sinais · Discurso em rede social" },
];

export function useCommandPaletteShortcut() {
  const { paletteOpen, setPaletteOpen } = useShell();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, setPaletteOpen]);
}

export function CommandPalette() {
  const { setPaletteOpen } = useShell();
  const router = useProgressRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useSavedList(RECENT_KEY);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPaletteOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setPaletteOpen]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const trimmed = q.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: { results: SearchResult[] }) => setResults(d.results))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [trimmed]);

  const shownResults = trimmed.length < 2 ? [] : results;

  const go = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };

  const open = (entity: SavedEntity) => {
    recent.add(entity, RECENT_MAX);
    go(entity.href);
  };

  const shortcuts = SHORTCUTS.filter((s) => s.label.toLowerCase().includes(trimmed.toLowerCase()));

  return (
    <div className="palette__backdrop" onClick={() => setPaletteOpen(false)}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // ↑/↓ move between result rows; Enter on a focused row activates it natively.
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          const rows = [...e.currentTarget.querySelectorAll<HTMLButtonElement>(".palette__row")];
          if (rows.length === 0) return;
          e.preventDefault();
          const i = rows.indexOf(document.activeElement as HTMLButtonElement);
          const next = e.key === "ArrowDown" ? (i + 1) % rows.length : i <= 0 ? rows.length - 1 : i - 1;
          rows[next].focus();
        }}
      >
        <div className="palette__input">
          <Search size={18} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar candidato, página, ação…"
            aria-label="Buscar candidato ou página"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.closest(".palette")?.querySelector<HTMLButtonElement>(".palette__row")?.click();
              }
            }}
          />
          <span className="input__kbd">Esc</span>
        </div>
        <div className="palette__list">
          {trimmed.length < 2 ? (
            <>
              {recent.items.length > 0 ? (
                <>
                  <div className="palette__heading">
                    Buscas recentes
                    <button type="button" className="palette__clear" onClick={recent.clear}>
                      Limpar
                    </button>
                  </div>
                  {recent.items.map((r) => (
                    <div key={r.href} className="palette__recent">
                      <button type="button" className="palette__row" onClick={() => open(r)}>
                        <History size={15} aria-hidden className="palette__icon" />
                        {r.label}
                        {r.sub ? <span className="palette__group">{r.sub}</span> : null}
                      </button>
                      <button
                        type="button"
                        className="palette__remove"
                        onClick={() => recent.remove(r.href)}
                        aria-label={`Remover ${r.label} das recentes`}
                      >
                        <X size={13} aria-hidden />
                      </button>
                    </div>
                  ))}
                  <div className="palette__heading">Ir para</div>
                </>
              ) : null}
              {shortcuts.map((s) => (
                <button key={s.href} type="button" className="palette__row" onClick={() => go(s.href)}>
                  {s.label}
                  <span className="palette__group">ir para</span>
                </button>
              ))}
            </>
          ) : loading ? (
            <div className="palette__empty">Buscando…</div>
          ) : shownResults.length === 0 && shortcuts.length === 0 ? (
            <div className="palette__empty">Nada encontrado.</div>
          ) : (
            <>
              {shortcuts.map((s) => (
                <button key={s.href} type="button" className="palette__row" onClick={() => go(s.href)}>
                  {s.label}
                  <span className="palette__group">ir para</span>
                </button>
              ))}
              {shownResults.map((r) =>
                r.kind === "candidato" ? (
                  <button
                    key={`c-${r.personId}`}
                    type="button"
                    className="palette__row"
                    onClick={() =>
                      open({
                        href: `/politico/${r.personId}`,
                        label: r.canonicalName,
                        sub: [r.latestOffice, r.latestYear].filter(Boolean).join(" ") || "candidato",
                      })
                    }
                  >
                    <SearchAvatar photoUrl={r.photoUrl} name={r.canonicalName} />
                    <span className="num" style={{ color: "var(--muted-2)", fontSize: 11 }}>
                      {r.cpf ? formatCpfCnpj(r.cpf) : "—"}
                    </span>
                    {r.canonicalName}
                    <span className="palette__group">
                      {r.latestOffice ?? "candidato"} {r.latestYear}
                    </span>
                  </button>
                ) : (
                  <button
                    key={`p-${r.cpf}`}
                    type="button"
                    className="palette__row"
                    onClick={() => open({ href: `/cpf/${r.cpf}`, label: r.canonicalName, sub: "pessoa física" })}
                  >
                    <SearchAvatar photoUrl={null} name={r.canonicalName} />
                    <span className="num" style={{ color: "var(--muted-2)", fontSize: 11 }}>
                      {formatCpfCnpj(r.cpf)}
                    </span>
                    {r.canonicalName}
                    <span className="palette__group">pessoa física</span>
                  </button>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
