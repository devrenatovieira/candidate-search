"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Thin progress bar under the top edge while a route loads. Starts on internal link clicks,
 * back/forward, and programmatic navigations made through useProgressRouter(); finishes when
 * the new pathname/search params commit.
 */

const START_EVENT = "candidate-search:nav-start";

function isSameUrl(href: string): boolean {
  const target = new URL(href, window.location.href);
  return target.pathname === window.location.pathname && target.search === window.location.search;
}

export function startNavigation(href?: string) {
  if (href && isSameUrl(href)) return;
  window.dispatchEvent(new Event(START_EVENT));
}

/** Drop-in for useRouter() whose push/replace also drive the progress bar. */
export function useProgressRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => {
        startNavigation(href);
        router.push(href, options);
      },
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
        startNavigation(href);
        router.replace(href, options);
      },
    }),
    [router]
  );
}

type Phase = "idle" | "loading" | "done";
type State = { phase: Phase; progress: number };

export function NavigationProgress() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ phase: "idle", progress: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (timer.current) clearInterval(timer.current);
      setState({ phase: "loading", progress: 8 });
      // Trickle towards 90% — the real end comes from the route commit below.
      timer.current = setInterval(
        () => setState((s) => (s.phase === "loading" && s.progress < 90 ? { ...s, progress: s.progress + (90 - s.progress) * 0.12 } : s)),
        200
      );
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (isSameUrl(url.href)) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  // Route committed: complete the bar, then fade it out.
  useEffect(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    const finish = setTimeout(() => setState((s) => (s.phase === "loading" ? { phase: "done", progress: 100 } : s)), 0);
    const hide = setTimeout(() => setState((s) => (s.phase === "done" ? { phase: "idle", progress: 0 } : s)), 400);
    return () => {
      clearTimeout(finish);
      clearTimeout(hide);
    };
  }, [pathname, params]);

  const { phase, progress } = state;
  return (
    <div
      className={`nav-progress nav-progress--${phase}`}
      role="progressbar"
      aria-label="Carregando página"
      aria-hidden={phase === "idle"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <span className="nav-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
