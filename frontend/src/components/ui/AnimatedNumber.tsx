import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number   // animation duration in ms, default 1200
  suffix?: string     // e.g. "%" or "ms"
}

/**
 * Counts from 0 to `value` over `duration` milliseconds using
 * requestAnimationFrame for smooth 60fps animation.
 * Think of it like a stopwatch counting up to a target.
 */
export function AnimatedNumber({ value, duration = 1200, suffix = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    startTime.current = null

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out: fast at first, slows down near the target value
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      }
    }

    rafId.current = requestAnimationFrame(animate)

    // Cleanup: cancel animation if component unmounts mid-count
    return () => cancelAnimationFrame(rafId.current)
  }, [value, duration])

  return <span>{display.toLocaleString()}{suffix}</span>
}