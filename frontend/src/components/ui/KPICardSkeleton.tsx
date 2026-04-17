/**
 * A skeleton specifically shaped like a KPI card.
 * It mimics the title row, the large number, and the sparkline area
 * so the transition from loading to loaded feels seamless — the
 * content "fills in" rather than "replacing" the skeleton.
 */
export function KPICardSkeleton() {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Title + icon row */}
      <div className="flex items-start justify-between">
        <div className="skeleton h-2.5 rounded w-20" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>

      {/* Large number */}
      <div className="skeleton h-8 rounded w-28" />

      {/* Sparkline area */}
      <div className="skeleton h-12 rounded w-full" style={{ animationDelay: '0.1s' }} />

      {/* "7-day trend" label */}
      <div className="skeleton h-2.5 rounded w-16" style={{ animationDelay: '0.2s' }} />
    </div>
  )
}