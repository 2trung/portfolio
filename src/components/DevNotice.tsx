import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const STORAGE_KEY = 'devnotice-dismissed'

export default function DevNotice() {
  const root = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<gsap.Context | null>(null)
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  )

  useLayoutEffect(() => {
    if (dismissed) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const d = (v: number) => (reduce ? v * 0.4 : v)

    const ctx = gsap.context(() => {
      gsap.from('.devnotice-card', {
        y: 40,
        opacity: 0,
        duration: d(0.8),
        delay: d(1),
        ease: 'power3.out',
      })
    }, root)
    ctxRef.current = ctx

    return () => ctx.revert()
  }, [dismissed])

  if (dismissed) return null

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ctxRef.current?.add(() => {
      gsap.to('.devnotice-card', {
        y: 24,
        opacity: 0,
        duration: reduce ? 0.2 : 0.5,
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => setDismissed(true),
      })
    })
  }

  return (
    <div ref={root}>
      <div
        role='status'
        className='devnotice-card fixed bottom-[4vh] right-[5vw] z-50 max-w-sm border border-overlay bg-cream p-5 font-sans text-ink shadow-2xl will-change-transform md:p-6'
      >
        <span className='flex items-center gap-2 text-xs uppercase tracking-widest text-red'>
          <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-red' />
          Work in progress
        </span>
        <p className='mt-3 text-sm leading-relaxed text-gray'>
          This site is still under development. Some sections are unfinished
          &mdash; the best experience is coming soon.
        </p>
        <button
          type='button'
          onClick={close}
          className='mt-4 cursor-pointer border border-ink/25 px-4 py-1.5 text-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-cream'
        >
          Got it
        </button>
      </div>
    </div>
  )
}
