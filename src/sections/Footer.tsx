import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const d = (v: number) => (reduce ? v * 0.4 : v)

    const ctx = gsap.context(() => {
      // set (not tween) the origin, otherwise from() animates it back to
      // 50% 50% and the draw drifts toward the center
      gsap.set('.footer-divider', { transformOrigin: 'left center' })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 55%',
          toggleActions: 'play none none reverse',
          invalidateOnRefresh: true,
        },
      })

      tl.from('.footer-title', {
        yPercent: 110,
        duration: d(1),
        ease: 'power3.out',
      })
        .from('.footer-divider', {
          scaleX: 0,
          duration: d(0.9),
          ease: 'power3.inOut',
        })
        .from(
          '.footer-email',
          { y: 30, opacity: 0, duration: d(0.7), ease: 'power3.out' },
          '-=0.4',
        )
        .from(
          '.footer-bar',
          { y: 20, opacity: 0, duration: d(0.6), ease: 'power2.out' },
          '-=0.3',
        )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <footer
      ref={root}
      id='footer'
      className='relative flex min-h-screen w-full flex-col justify-between bg-ink px-6 pt-[14vh] text-cream md:px-[5vw]'
    >
      <div>
        <div className='overflow-hidden'>
          <h2
            className='footer-title font-display font-bold uppercase leading-[0.9] tracking-tighter will-change-transform'
            style={{ fontSize: 'clamp(3rem, 11.5vw, 16rem)' }}
          >
            Get in touch
          </h2>
        </div>

        <div className='footer-divider mt-4 border-t border-cream/20 md:mt-6' />

        <a
          href='mailto:trung.nguyen@msn.com'
          className='footer-email mt-4 inline-block font-sans text-cream/70 transition-colors duration-300 will-change-transform hover:text-cream md:mt-6'
          style={{ fontSize: 'clamp(1.25rem, 2.4vw, 2.25rem)' }}
        >
          trung.nguyen@msn.com
        </a>
      </div>

      <div className='footer-bar flex w-full items-center justify-between border-t border-cream/15 py-6 font-sans text-sm text-cream/60'>
        <span>©2026 Trung Nguyen</span>
        <span className='flex items-center gap-1.5'>
          Crafted with
          <svg
            viewBox='0 0 24 24'
            className='h-4 w-4 fill-red'
            aria-label='love'
            role='img'
          >
            <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
          </svg>
        </span>
      </div>
    </footer>
  )
}
