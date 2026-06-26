import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

interface PreloaderProps {
  /** Fired the moment the panel begins fading — cue the hero to fade in. */
  onReveal: () => void
  /** Fired once the intro has fully finished and the panel can unmount. */
  onComplete: () => void
}


export default function Preloader({ onReveal, onComplete }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const meta = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  const done = useRef(onComplete)
  done.current = onComplete
  const reveal = useRef(onReveal)
  reveal.current = onReveal

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const w = bar.current?.offsetWidth ?? 280
      const h = bar.current?.offsetHeight ?? 6
      const angle = (-15 * Math.PI) / 180
      const halfW = window.innerWidth / 2
      const halfH = window.innerHeight / 2
      const reachX = halfW * Math.abs(Math.cos(angle)) + halfH * Math.abs(Math.sin(angle))
      const reachY = halfW * Math.abs(Math.sin(angle)) + halfH * Math.abs(Math.cos(angle))
      const pad = 1.04
      const coverScaleX = ((2 * reachX) / w) * pad
      const coverScaleY = ((2 * reachY) / h) * pad

      const progress = { value: 0 }
      const setFill = () => {
        const v = progress.value
        if (count.current) count.current.textContent = String(Math.round(v)).padStart(3, '0')
        if (fill.current) fill.current.style.transform = `scaleX(${v / 100})`
      }

      const t = {
        load: reduce ? 2 : 2.4, // bar fills / counter climbs
        caption: 0.5, // loading caption fades out
        rotate: 0.7, // bar tilts into a slash
        zoom: 1, // slash expands to cover the screen
        fade: 0.8, // panel fades out to show the hero
        hold: 0.4, // small beat after the bar fills
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => done.current(),
      })

      // 1 — Mock asset loading: fill the bar while the counter climbs.
      tl.to(progress, {
        value: 100,
        duration: t.load,
        ease: 'power1.inOut',
        onUpdate: setFill,
      })

      // 2 — Settle, then retire the loading caption.
      tl.to(meta.current, { autoAlpha: 0, y: 8, duration: t.caption }, `+=${t.hold}`)

      // 3 — Rotate the bar into a slash.
      tl.to(bar.current, { rotate: -15, duration: t.rotate, ease: 'power4.inOut' })

      // 4 — Expand the slash so each edge sweeps out to a screen edge.
      tl.to(bar.current, {
        scaleX: coverScaleX,
        scaleY: coverScaleY,
        duration: t.zoom,
        ease: 'power3.inOut',
      })

      // 5 — Cross-fade the panel out (and cue the hero in) as the bar reaches full screen.
      tl.to(
        root.current,
        {
          autoAlpha: 0,
          duration: t.fade,
          ease: 'sine.inOut',
          onStart: () => reveal.current(),
        },
        `<${t.zoom * 0.7}`,
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red"
      role="progressbar"
      aria-label="Loading"
    >
      {/* Progress bar */}
      <div
        ref={bar}
        className="relative h-6 w-[min(45vw,220px)] overflow-hidden bg-ink/20 will-change-transform"
      >
        <div
          ref={fill}
          className="absolute inset-0 origin-left bg-ink"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Caption */}
      <div
        ref={meta}
        className="absolute inset-x-0 bottom-5 flex items-end justify-between w-[min(40vw,200px)] mx-auto"
      >
        <span className="text-xs uppercase tracking-[0.25em] text-ink">
          Loading
        </span>
        <span ref={count} className="text-xs tabular-nums text-ink">
          000
        </span>
      </div>
    </div>
  )
}
