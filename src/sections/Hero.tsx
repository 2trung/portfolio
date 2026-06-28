import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

function getTime() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())
}

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
  const [time, setTime] = useState(getTime)

  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000)
    return () => clearInterval(id)
  }, [])

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

      // 4 — Tagline lines settle in at the top, slightly behind the name.
      tl.from(
        '.hero-tagline',
        { autoAlpha: 0, y: 20, duration: 0.9, stagger: 0.12 },
        '-=1.4',
      )

      // 5 — Corner meta (location/clock) and scroll hint fade in last.
      tl.from(
        '.hero-meta',
        { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.15 },
        '-=0.9',
      )

      // Scroll indicator: the arrow bobs down and back on a gentle loop.
      gsap.to('.hero-scroll', {
        y: 8,
        duration: 0.9,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, root)

    return () => ctx.revert()
  }, [revealed])

  return (
    <section
      ref={root}
      className='relative flex min-h-screen w-full flex-col justify-end overflow-hidden px-[5vw] pb-[5vh]'
    >
      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent' />

      <div className='absolute inset-x-[5vw] top-[5vh] flex items-start justify-between gap-[6vw]'>
        {/* Tagline */}
        <div className='max-w-[58vw] sm:max-w-[44ch]'>
          <p
            className='hero-tagline font-display text-cream leading-none tracking-tight will-change-transform'
            style={{ fontSize: 'clamp(1.05rem, 2vw, 1.75rem)' }}
          >
            Crafting immersive digital experiences
          </p>
          <p
            className='hero-tagline mt-2.5 font-sans text-cream/55 leading-snug tracking-[0.02em] will-change-transform'
            style={{ fontSize: 'clamp(0.8rem, 1.1vw, 1rem)' }}
          >
            Creative developer blending code, design, and motion.
          </p>
        </div>

        {/* Location & local time */}
        <div className='hero-meta flex shrink-0 flex-col items-end text-right will-change-transform'>
          <span className='font-sans text-xs uppercase leading-none tracking-[0.2em] text-cream/70 sm:text-sm'>
            Hanoi, VN
          </span>
          <span className='mt-2.5 whitespace-nowrap font-sans text-xs uppercase tracking-[0.2em] text-cream/45 tabular-nums sm:text-sm'>
            {time} <span className='text-cream/30'>GMT+7</span>
          </span>
        </div>
      </div>

      {/* Scroll hint */}
      <div className='hero-meta pointer-events-none absolute bottom-[2vh] right-[1vw] flex flex-col items-center gap-1 will-change-transform'>
        <span className='font-sans text-xs uppercase tracking-[0.25em] text-cream/55 [writing-mode:vertical-rl]'>
          Scroll
        </span>
        <svg
          aria-hidden='true'
          viewBox='0 0 24 24'
          fill='none'
          className='hero-scroll h-5 w-5 text-cream/70'
        >
          <path
            d='M12 4v15M5 13l7 7 7-7'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>

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
