import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Skeleton className="h-7 w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-1.5 h-4 w-2/3 max-w-2xl" />
      </section>
      <section className="compare" style={{ ["--cols" as string]: 2 }}>
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} className="compare__row">
            <div className="compare__label">
              <Skeleton className="h-3.5 w-28" />
            </div>
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="compare__cell">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-1 w-full" />
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
