"use client";

const BULLETS = [
  "Decisions accumulate",
  "Outcomes improve future decisions",
  "Governance compounds over time",
];

export interface InstitutionalMemoryExplainerProps {
  className?: string;
}

export function InstitutionalMemoryExplainer({ className = "" }: InstitutionalMemoryExplainerProps) {
  return (
    <div className={className}>
      <p className="text-sm text-ink-muted">
        Decisions and outcomes accumulate, creating a long-term execution history that improves future planning.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink">
        {BULLETS.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
