import { useEffect, useState } from 'react'

/**
 * Gates the shared WebGPU frameloop. The canvas is fixed behind the page, so it
 * only shows through sections tagged `data-canvas-reveal` (the opening reveal,
 * the About track). Opaque sections with no tag fully cover it — while one of
 * those owns the viewport there is nothing to draw, so we pause the render loop
 * and let the GPU idle instead of shading hidden pixels. We also pause when the
 * tab is backgrounded.
 *
 * Returns `true` while at least one revealing section intersects the viewport
 * AND the document is visible. Feed it to <Canvas frameloop>.
 */
export function useCanvasActive(): boolean {
  const [active, setActive] = useState(true)

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      '[data-canvas-reveal]',
    )
    const visible = new Set<Element>()
    let tabVisible = !document.hidden

    const update = () => setActive(tabVisible && visible.size > 0)

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      }
      update()
    })
    targets.forEach((t) => io.observe(t))

    const onVisibility = () => {
      tabVisible = !document.hidden
      update()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return active
}
