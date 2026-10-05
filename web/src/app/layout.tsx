import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { getSidebarCounts } from "@/lib/stats";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Candidate Search — dados públicos de candidatos",
    template: "%s · Candidate Search",
  },
  applicationName: "Candidate Search",
  authors: [{ name: "Renato Vieira" }],
  creator: "Renato Vieira",
  description:
    "Cruzamento de dados públicos de políticos brasileiros por CPF/CNPJ. Indício, não prova — todo campo aponta para a fonte oficial de onde saiu.",
};

// Runs before hydration so a saved theme applies with no flash.
const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem("theme");
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const counts = getSidebarCounts();

  return (
    <html
      lang="pt-BR"
      className={`${publicSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <AppShell counts={counts}>{children}</AppShell>
      </body>
    </html>
  );
}
