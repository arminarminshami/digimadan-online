import { useDepthReveal } from '../lib/useDepthReveal'

/**
 * Wraps a page section so it rises out of the "rock" as the user scrolls
 * to it — tilting back into place like a stratum settling level.
 * depth controls how pronounced the tilt/rise is (1 = normal, 1.4 = hero-level).
 */
export default function DepthSection({ children, depth = 1, className = '', as = 'section' }) {
  const { ref, revealed } = useDepthReveal()
  const Tag = as

  return (
    <Tag
      ref={ref}
      className={
        'depth-section' + (revealed ? ' depth-section--revealed' : '') + (className ? ' ' + className : '')
      }
      style={{ '--depth-amount': depth }}
    >
      {children}
    </Tag>
  )
}
