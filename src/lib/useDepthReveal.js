import { useEffect, useRef, useState } from 'react'

/**
 * Attaches an IntersectionObserver to the returned ref and reports
 * how "in view" the element is (0 = just entering, 1 = fully settled).
 * Used to drive the strata/depth scroll effect without a heavy scroll
 * library — keeps the effect tied to real layout, works with RTL,
 * and respects prefers-reduced-motion automatically via CSS.
 */
export function useDepthReveal({ threshold = 0.15 } = {}) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, revealed }
}
