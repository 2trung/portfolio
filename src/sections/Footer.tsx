import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lenis } from '../lenis'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const d = (v: number) => (reduce ? v * 0.4 : v)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 55%',
          toggleActions: 'play none none reverse',
          invalidateOnRefresh: true,
        },
      })

      tl.from('.footer-email', {
        yPercent: 110,
        duration: d(1),
        ease: 'power3.out',
      })
        .from(
          '.footer-social',
          {
            y: 20,
            opacity: 0,
            duration: d(0.6),
            ease: 'power2.out',
            stagger: 0.08,
          },
          '-=0.5',
        )
        .from(
          '.footer-image',
          { y: 40, opacity: 0, duration: d(0.8), ease: 'power3.out' },
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
      <div className='flex flex-col gap-8 md:flex-row md:items-end md:justify-between'>
        {/* fontSize lives here so the em clip-compensation scales with the text */}
        <div
          className='overflow-hidden pt-[0.1em] mt-[-0.1em] pb-[0.2em] mb-[-0.2em]'
          style={{ fontSize: 'clamp(1.75rem, 6vw, 7.5rem)' }}
        >
          <a
            href='mailto:trung.nguyen@msn.com'
            className='footer-email group flex items-center gap-[0.12em] font-display font-bold leading-none tracking-tighter will-change-transform'
          >
            <span className="relative after:absolute after:bottom-[-0.04em] after:left-0 after:h-[0.035em] after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-out after:content-[''] group-hover:after:origin-left group-hover:after:scale-x-100">
              trung.nguyen@msn.com
            </span>
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
              className='h-[0.7em] w-[0.7em] shrink-0 transition-transform duration-300 group-hover:-translate-y-[0.1em] group-hover:translate-x-[0.1em]'
            >
              <path d='M7 17 17 7M9 7h8v8' />
            </svg>
          </a>
        </div>

        <div className='flex items-center gap-5 pb-2 md:gap-6'>
          {[
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/',
              path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/2trung',
              path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
            },
            {
              label: 'Instagram',
              href: 'https://www.instagram.com/',
              path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
            },
          ].map(({ label, href, path }) => (
            <a
              key={label}
              href={href}
              target='_blank'
              rel='noreferrer'
              aria-label={label}
              className='footer-social text-cream/60 transition-colors duration-300 will-change-transform hover:text-cream'
            >
              <svg viewBox='0 0 24 24' className='h-6 w-6 fill-current md:h-7 md:w-7'>
                <path d={path} />
              </svg>
            </a>
          ))}
        </div>
      </div>
              <div className='footer-image w-full overflow-hidden rounded-2xl will-change-transform'>
            <img
              src='/images/footer/starry_night.webp'
              alt='Starry night artwork'  
              loading='lazy'
              className='block h-auto w-full max-h-[50vh] object-cover object-center'
            />
          </div>

      <div className='footer-bar flex w-full items-center justify-between border-t border-cream/15 py-6 font-sans text-sm text-cream/60'>
        <span>©2026 — All rights reserved</span>
        <span className='flex items-center gap-6 md:gap-8'>
          <button
            type='button'
            onClick={() =>
              lenis
                ? lenis.scrollTo(0, {
                    immediate: window.matchMedia(
                      '(prefers-reduced-motion: reduce)',
                    ).matches,
                  })
                : window.scrollTo(0, 0)
            }
            className='group/top flex cursor-pointer items-center gap-1.5 transition-colors duration-300 hover:text-cream'
          >
            Back to top
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
              className='h-4 w-4 transition-transform duration-300 group-hover/top:-translate-y-0.5'
            >
              <path d='M12 19V5M5 12l7-7 7 7' />
            </svg>
          </button>
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
        </span>
      </div>
    </footer>
  )
}
