"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProgressRouter } from "@/components/shell/navigation-progress";
import { Plus, Search, X } from "lucide-react";
import type { SearchResult } from "@/lib/queries";
import { COMPARE_KEY, COMPARE_MAX, useSavedList, type SavedEntity } from "@/lib/local-store";
import { SearchAvatar } from "@/components/search-avatar";
import { useToast } from "@/components/ui/toast";

const idOf = (href: string) => Number(href.split("/").pop());
const urlFor = (ids: number[]) => (ids.length > 0 ? `/comparar?ids=${ids.join(",")}` : "/comparar");

/**
 * The URL (?ids=) is what the server renders and what people share; the saved list is what the
 * "Comparar" buttons write to. With no ids in the URL we load the saved list; with ids we adopt them.
 */
export function CompareSync({ entities }: { entities: SavedEntity[] }) {
  const router = useProgressRouter();
  const params = useSearchParams();
  const cmp = useSavedList(COMPARE_KEY);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!params.get("ids")) {
      const saved = cmp.items.map((i) => idOf(i.href)).filter(Number.isInteger);
      if (saved.length > 0) router.replace(urlFor(saved));
      return;
    }
    const same =
      entities.length === cmp.items.length && entities.every((e, i) => cmp.items[i]?.href === e.href);
    if (!same) {
      cmp.clear();
      [...entities].reverse().forEach((e) => cmp.add(e, COMPARE_MAX));
    }
  }, [entities, cmp, params, router]);

  return null;
}

export function CompareRemove({ href, ids, personId }: { href: string; ids: number[]; personId: number }) {
  const router = useProgressRouter();
  const cmp = useSavedList(COMPARE_KEY);
  return (
    <button
      type="button"
      className="compare__remove print-hidden"
      aria-label="Remover da comparação"
      title="Remover da comparação"
      onClick={() => {
        cmp.remove(href);
        router.replace(urlFor(ids.filter((id) => id !== personId)));
      }}
    >
      <X size={15} aria-hidden />
    </button>
  );
}

export function CompareAdd() {
  const router = useProgressRouter();
  const params = useSearchParams();
  const cmp = useSavedList(COMPARE_KEY);
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = q.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: { results: SearchResult[] }) => setResults(d.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [trimmed]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const candidates = trimmed.length < 2 ? [] : results.filter((r) => r.kind === "candidato");

  function add(r: Extract<SearchResult, { kind: "candidato" }>) {
    const current = (params.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (current.includes(r.personId)) {
      notify("Esse candidato já está na comparação", "error");
      return;
    }
    const sub = [r.latestOffice, [r.latestPartyAbbr, r.latestState].filter(Boolean).join("/"), r.latestYear]
      .filter(Boolean)
      .join(" · ");
    cmp.add({ href: `/politico/${r.personId}`, label: r.canonicalName, sub }, COMPARE_MAX);
    setOpen(false);
    setQ("");
    router.replace(urlFor([...current, r.personId].slice(0, COMPARE_MAX)));
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--primary print-hidden" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden />
        Adicionar candidato
      </button>
    );
  }

  return (
    <div className="compare-add print-hidden">
      <div className="input">
        <Search size={16} aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Nome ou CPF do candidato"
          aria-label="Buscar candidato para comparar"
        />
        <button type="button" className="modal__close" onClick={() => setOpen(false)} aria-label="Fechar busca">
          <X size={15} aria-hidden />
        </button>
      </div>
      {trimmed.length >= 2 ? (
        <div className="compare-add__list">
          {loading ? (
            <div className="palette__empty">Buscando…</div>
          ) : candidates.length === 0 ? (
            <div className="palette__empty">Nenhum candidato encontrado.</div>
          ) : (
            candidates.slice(0, 8).map((r) =>
              r.kind === "candidato" ? (
                <button key={r.personId} type="button" className="palette__row" onClick={() => add(r)}>
                  <SearchAvatar photoUrl={r.photoUrl} name={r.canonicalName} />
                  {r.canonicalName}
                  <span className="palette__group">
                    {r.latestOffice ?? "candidato"} {r.latestYear}
                  </span>
                </button>
              ) : null
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
