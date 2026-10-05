"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SidebarCounts } from "@/lib/stats";
import { ToastProvider } from "@/components/ui/toast";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { NavigationProgress } from "./navigation-progress";

export function AppShell({ counts, children }: { counts: SidebarCounts; children: ReactNode }) {
  return (
    <ShellProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <div className="shell-layout">
          <Sidebar counts={counts} />
          <div className="shell-main">
            <Topbar />
            <ContentBody>{children}</ContentBody>
          </div>
        </div>
      </ToastProvider>
    </ShellProvider>
  );
}

function ContentBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/grafo")) {
    return <div style={{ height: "calc(100vh - var(--navbar-offset))" }}>{children}</div>;
  }
  return <div className="content__inner">{children}</div>;
}
