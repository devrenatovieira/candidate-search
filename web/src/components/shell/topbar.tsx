"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FileSearch, Menu } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { useShell } from "./shell-context";
import { CommandPalette, useCommandPaletteShortcut } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const { header, analysisMode, setAnalysisMode, navOpen, setNavOpen } = useShell();
  const pathname = usePathname();
  useCommandPaletteShortcut();

  const analysisAvailable = !pathname.startsWith("/grafo");
  useEffect(() => {
    if (!analysisAvailable && analysisMode) setAnalysisMode(false);
  }, [analysisAvailable, analysisMode, setAnalysisMode]);

  return (
    <div className="navbar-wrap">
      <div
        className="navbar-blur"
        aria-hidden
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      />
      <div className="navbar">
        <button
          type="button"
          className="btn btn--icon navbar__menu"
          onClick={() => setNavOpen(!navOpen)}
          aria-label="Abrir menu"
          aria-controls="app-sidebar"
          aria-expanded={navOpen}
        >
          <Menu size={16} />
        </button>
        <Link href="/" className="navbar__home" aria-label="Candidate Search, página inicial">
          <LogoMark size={24} />
        </Link>
        <span className="crumb hidden sm:inline">{header.group}</span>
        {header.current ? (
          <>
            <span className="crumb crumb__sep hidden sm:inline">/</span>
            <span className="crumb__current">{header.current}</span>
          </>
        ) : null}
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flex: "none" }}>
          {header.actions}
          {analysisAvailable ? (
            <button
              type="button"
              className={`btn${analysisMode ? " btn--fonte-active" : ""}`}
              onClick={() => setAnalysisMode(!analysisMode)}
              title="Modo análise: passe o mouse sobre um dado para destacá-lo, clique para ver a fonte"
              aria-pressed={analysisMode}
              aria-label="Ver fontes"
            >
              <FileSearch size={15} aria-hidden />
              <span className="hidden sm:inline">Ver fontes</span>
            </button>
          ) : null}
          <ThemeToggle />
        </span>
        <CommandPaletteMount />
      </div>
    </div>
  );
}

function CommandPaletteMount() {
  const { paletteOpen } = useShell();
  return paletteOpen ? <CommandPalette /> : null;
}
