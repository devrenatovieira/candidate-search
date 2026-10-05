import Link from "next/link";

/** Lupa sobre o "✓" da cédula: buscar e conferir. Herda a cor via currentColor. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="13.5" cy="13.5" r="9.75" stroke="currentColor" strokeWidth="3" />
      <path
        d="M9 13.8l3.2 3.2 6.1-6.3"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21.2 21.2l7 7" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <Link href="/" className="brand-logo" aria-label="Candidate Search, página inicial">
      <LogoMark className="brand-logo__mark" />
      <span className="brand-logo__word">
        Candidate Search
        {withTagline ? <span className="brand-logo__tag">Dados públicos de candidatos</span> : null}
      </span>
    </Link>
  );
}
