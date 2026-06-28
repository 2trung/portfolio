import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

interface HeroProps {
  /** Flips true the moment the preloader has fully finished */
  revealed: boolean
}

const NAME = 'Trung Nguyen'

const CONTACTS = [
  { label: 'Email', href: 'mailto:hello@trungnguyen.dev' },
  { label: 'GitHub', href: 'https://github.com/2trung' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
]

const WORDS = NAME.split(' ').map((word, wi) => ({
  key: wi,
  chars: [...word].map((char, ci) => ({ char, key: `${wi}-${ci}` })),
}))

export default function Hero({ revealed }: HeroProps) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (!revealed) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // 1 — Name rises in, character by character, from below its mask.
      tl.from('.hero-char', {
        yPercent: 120,
        duration: 1,
        stagger: 0.05,
        ease: 'power4.out',
      })

      // 2 — Divider traces from left to right.
      tl.from(
        '.hero-line',
        {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.9,
          ease: 'power2.inOut',
        },
        '-=0.35',
      )

      // 3 — Contact links fade up in sequence.
      tl.from(
        '.hero-contact',
        { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.08 },
        '-=0.45',
      )
    }, root)

    return () => ctx.revert()
  }, [revealed])

  return (
    <section
      ref={root}
      className='relative flex min-h-screen w-full flex-col justify-end overflow-hidden px-[5vw] pb-[5vh]'
    >
      {/* Scrim: darkens the lower area so the name stays legible over the rods. */}
      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent' />

      <div className='relative flex flex-col gap-[clamp(1.25rem,3vw,2.5rem)]'>
        {/* ---- Name ------------------------------------------------- */}
        <h1
          aria-label={NAME}
          className='flex flex-wrap items-end justify-between font-display font-bold uppercase leading-[0.85] tracking-tight text-cream'
          style={{ fontSize: 'clamp(2.75rem, 11.5vw, 14rem)' }}
        >
          {WORDS.map((word) => (
            <span key={word.key} aria-hidden='true' className='inline-block'>
              {word.chars.map(({ char, key }) => (
                <span
                  key={key}
                  className='inline-block overflow-hidden pb-[0.12em] mb-[-0.12em] align-bottom'
                >
                  <span className='hero-char inline-block will-change-transform'>
                    {char}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* ---- Divider ---------------------------------------------- */}
        <div className='hero-line h-px w-full origin-left bg-cream/30 will-change-transform' />

        {/* ---- Contact links ---------------------------------------- */}
        <nav
          aria-label='Contact'
          className='flex flex-wrap gap-x-[clamp(1.5rem,4vw,4rem)] gap-y-3'
        >
          {CONTACTS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className='hero-contact group relative inline-block font-sans text-sm uppercase tracking-[0.2em] text-cream/70 transition-colors duration-300 hover:text-cream sm:text-base'
            >
              {label}
              {/* Underline that wipes in on hover. */}
              <span className='absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-cream transition-transform duration-300 ease-out group-hover:scale-x-100' />
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
