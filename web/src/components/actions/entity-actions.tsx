"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, GitCompareArrows, Printer, Share2, Star } from "lucide-react";
import { COMPARE_KEY, COMPARE_MAX, FAVORITES_KEY, useSavedList, type SavedEntity } from "@/lib/local-store";
import { useToast } from "@/components/ui/toast";

/** Toolbar for a ficha (candidato, CNPJ ou CPF): favoritar, comparar, compartilhar, imprimir. */
export function EntityActions({ entity, comparable = false }: { entity: SavedEntity; comparable?: boolean }) {
  return (
    <div className="entity-actions print-hidden" role="toolbar" aria-label="Ações da ficha">
      <FavoriteButton entity={entity} />
      {comparable ? <CompareButton entity={entity} /> : null}
      <ShareButton title={entity.label} />
      <button type="button" className="btn" onClick={() => window.print()}>
        <Printer size={15} aria-hidden />
        Imprimir / PDF
      </button>
    </div>
  );
}

export function FavoriteButton({ entity }: { entity: SavedEntity }) {
  const fav = useSavedList(FAVORITES_KEY);
  const notify = useToast();
  const active = fav.has(entity.href);

  return (
    <button
      type="button"
      className={`btn${active ? " btn--on" : ""}`}
      aria-pressed={active}
      onClick={() => {
        if (active) {
          fav.remove(entity.href);
          notify("Removido dos favoritos");
        } else {
          fav.add(entity);
          notify("Salvo nos favoritos");
        }
      }}
    >
      <Star size={15} aria-hidden className={active ? "star-pop" : undefined} fill={active ? "currentColor" : "none"} />
      {active ? "Favorito" : "Favoritar"}
    </button>
  );
}

function CompareButton({ entity }: { entity: SavedEntity }) {
  const cmp = useSavedList(COMPARE_KEY);
  const notify = useToast();
  const active = cmp.has(entity.href);
  const full = !active && cmp.items.length >= COMPARE_MAX;

  if (active) {
    return (
      <span className="btn-group">
        <button
          type="button"
          className="btn btn--on"
          aria-pressed
          onClick={() => {
            cmp.remove(entity.href);
            notify("Removido da comparação");
          }}
        >
          <GitCompareArrows size={15} aria-hidden />
          Na comparação
        </button>
        <Link href="/comparar" className="btn">
          Ver ({cmp.items.length})
        </Link>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="btn"
      disabled={full}
      title={full ? `A comparação aceita até ${COMPARE_MAX} candidatos` : undefined}
      onClick={() => {
        cmp.add(entity, COMPARE_MAX);
        notify(`Adicionado à comparação (${Math.min(cmp.items.length + 1, COMPARE_MAX)}/${COMPARE_MAX})`);
      }}
    >
      <GitCompareArrows size={15} aria-hidden />
      Comparar
    </button>
  );
}

function ShareButton({ title }: { title: string }) {
  const notify = useToast();

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · Candidate Search`, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copiado");
    } catch {
      notify("Não foi possível copiar o link", "error");
    }
  }

  return (
    <button type="button" className="btn" onClick={share}>
      <Share2 size={15} aria-hidden />
      Compartilhar
    </button>
  );
}

/** Small inline button that copies an identifier (CPF, CNPJ, título) to the clipboard. */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const notify = useToast();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className="copy-value print-hidden"
      aria-label={`Copiar ${label}`}
      title={`Copiar ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          notify(`${label} copiado`);
          setTimeout(() => setDone(false), 1500);
        } catch {
          notify(`Não foi possível copiar o ${label}`, "error");
        }
      }}
    >
      {done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
    </button>
  );
}
