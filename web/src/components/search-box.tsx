"use client";

import { Search } from "lucide-react";
import { useShell } from "./shell/shell-context";

export function SearchBox() {
  const { setPaletteOpen } = useShell();

  return (
    <button type="button" onClick={() => setPaletteOpen(true)} className="searchbar">
      <Search size={20} className="searchbar__icon" aria-hidden />
      <span className="searchbar__text">
        <span className="sm:hidden">Nome ou CPF</span>
        <span className="hidden sm:inline">Nome ou CPF de candidato, doador ou fornecedor</span>
      </span>
      <span className="searchbar__cta">
        Buscar <kbd>Ctrl K</kbd>
      </span>
    </button>
  );
}
