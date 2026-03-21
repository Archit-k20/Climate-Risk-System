/**
 * A flexible skeleton loader that mimics the shape of a card component.
 * The shimmer animation is defined in index.css as the .skeleton class.
 * 
 * We accept a `lines` prop to control how many content lines to show,
 * making this reusable across KPI cards, activity feed items, and 
 * any other card-shaped content in the app.
 */
interface SkeletonCardProps {
  lines?: number       // how many shimmer lines to show inside the card
  height?: string      // overall card height, e.g. "120px"
  showHeader?: boolean // whether to show a header bar at the top
}

export function SkeletonCard({
  lines = 3,
  height = 'auto',
  showHeader = true,
}: SkeletonCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        height,
      }}
    >
      {/* Header row: mimics a title + icon row */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 rounded w-24" />
          <div className="skeleton h-7 w-7 rounded-lg" />
        </div>
      )}

      {/* Content lines of varying widths — the variation makes it
          look more natural and less mechanical than uniform bars */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{
            // Each line is slightly shorter than the previous,
            // mimicking how real text lines vary in length
            width: `${100 - i * 12}%`,
            // Stagger the animation delay slightly per line so the
            // shimmer appears to "wave" across the card
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}