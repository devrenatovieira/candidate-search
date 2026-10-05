"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Handshake,
  House,
  Landmark,
  MessageSquareWarning,
  Network,
  Receipt,
  Repeat,
  Search,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import type { SidebarCounts } from "@/lib/stats";
import { Logo } from "@/components/brand/logo";
import { useShell } from "./shell-context";

type NavLink = { href: string; label: string; icon: LucideIcon; count?: number; alert?: boolean };

export function Sidebar({ counts }: { counts: SidebarCounts }) {
  const pathname = usePathname();
  const { setPaletteOpen, navOpen, setNavOpen } = useShell();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  const top: NavLink[] = [
    { href: "/", label: "Início", icon: House },
    { href: "/grafo", label: "Grafo de correlações", icon: Network },
    { href: "/ranking", label: "Bens declarados", icon: Wallet },
    { href: "/emendas", label: "Emendas parlamentares", icon: Landmark },
  ];
  const sinais: NavLink[] = [
    { href: "/sinais/doacao-circular", label: "Doação circular", icon: Repeat, count: counts.circularDonations, alert: true },
    { href: "/sinais/despesa-desproporcional", label: "Despesa desproporcional", icon: Receipt, count: counts.disproportionateExpense },
    { href: "/sinais/socio-fornecedor", label: "Sócio de fornecedor", icon: Handshake, count: counts.supplierPartner },
    { href: "/sinais/analise-ia", label: "Análise de IA", icon: Sparkles, count: counts.aiReview },
    { href: "/sinais/discurso", label: "Discurso em rede social", icon: MessageSquareWarning, count: counts.discourse, alert: true },
  ];

  return (
    <>
      {navOpen ? <div className="sidebar-scrim" onClick={() => setNavOpen(false)} aria-hidden /> : null}
      <aside id="app-sidebar" className={`app-sidebar${navOpen ? " is-open" : ""}`}>
        <div className="app-sidebar__top">
          <Logo />
          <button
            type="button"
            className="btn btn--icon navbar__menu"
            onClick={() => setNavOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        <button type="button" className="app-sidebar__search" onClick={() => setPaletteOpen(true)}>
          <Search size={15} aria-hidden />
          Buscar candidato
          <kbd>Ctrl K</kbd>
        </button>

        <nav className="app-sidebar__nav" aria-label="Navegação principal">
          <div className="app-sidebar__group">
            <div className="navmenu__items">
              {top.map((l) => (
                <NavItem key={l.href} link={l} active={pathname === l.href} />
              ))}
            </div>
          </div>
          <div className="app-sidebar__group">
            <div className="label">Sinais de alerta</div>
            <div className="navmenu__items">
              {sinais.map((l) => (
                <NavItem key={l.href} link={l} active={pathname === l.href} />
              ))}
            </div>
          </div>
        </nav>

        <p className="app-sidebar__foot">
          Fontes oficiais: TSE, Receita Federal e Portal da Transparência. Indício não é prova.
        </p>
      </aside>
    </>
  );
}

function NavItem({ link: l, active }: { link: NavLink; active: boolean }) {
  const Icon = l.icon;
  return (
    <Link href={l.href} className={`navitem${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon size={16} aria-hidden />
      {l.label}
      {l.count != null ? (
        <span className={`navitem__count${l.alert && l.count > 0 ? " navitem__count--alert" : ""}`}>
          {l.count.toLocaleString("pt-BR")}
        </span>
      ) : null}
    </Link>
  );
}
