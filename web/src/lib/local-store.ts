"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-browser lists (favoritos, recentes, comparação) kept in localStorage.
 * Every hook instance subscribes to the same key, so the sidebar, the topbar and the
 * page stay in sync — including across tabs via the `storage` event.
 */

export type SavedEntity = {
  href: string;
  label: string;
  /** Short context line, e.g. "Deputado Federal · PT/SP" or "CNPJ". */
  sub?: string;
};

export { COMPARE_KEY, COMPARE_MAX, FAVORITES_KEY, RECENT_KEY, RECENT_MAX } from "./saved-keys";

const EVENT = "candidate-search:store";
const EMPTY: SavedEntity[] = [];
const cache = new Map<string, { raw: string | null; parsed: SavedEntity[] }>();

function isSavedEntity(v: unknown): v is SavedEntity {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.href === "string" &&
    o.href.startsWith("/") &&
    typeof o.label === "string" &&
    (o.sub === undefined || typeof o.sub === "string")
  );
}

function read(key: string): SavedEntity[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.parsed;
  let parsed: SavedEntity[] = EMPTY;
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    parsed = Array.isArray(value) ? value.filter(isSavedEntity) : EMPTY;
  } catch {
    parsed = EMPTY;
  }
  cache.set(key, { raw, parsed });
  return parsed;
}

function write(key: string, items: SavedEntity[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full or blocked: the list just doesn't persist.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSavedList(key: string) {
  const items = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY
  );

  const has = useCallback((href: string) => items.some((i) => i.href === href), [items]);

  const remove = useCallback((href: string) => {
    write(key, read(key).filter((i) => i.href !== href));
  }, [key]);

  /** Adds to the front, dropping an older copy of the same href; keeps at most `max`. */
  const add = useCallback((item: SavedEntity, max = 50) => {
    write(key, [item, ...read(key).filter((i) => i.href !== item.href)].slice(0, max));
  }, [key]);

  const clear = useCallback(() => write(key, []), [key]);

  return { items, has, add, remove, clear };
}
