import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export default function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    // The timeline is re-created on every resplit (resize), so it can't live
    // in the context alone — track it and kill manually.
    let fillTl: gsap.core.Timeline | null = null

    const killTimeline = () => {
      fillTl?.scrollTrigger?.kill(true)
      fillTl?.kill()
      fillTl = null
    }

    const ctx = gsap.context(() => {
      const section = root.current!
      const tokens = getComputedStyle(document.documentElement)
      const ink = tokens.getPropertyValue('--color-ink').trim()
      const cream = tokens.getPropertyValue('--color-cream').trim()
      const gray = tokens.getPropertyValue('--color-gray').trim()

      const split = SplitText.create('.manifesto-text', {
        type: 'lines',
        autoSplit: true,
        onSplit: (self) => {
          killTimeline()
          const lines = self.lines as HTMLElement[]

          // Each line is a gray→ink gradient clipped to the glyphs; sliding
          // the background sweeps the ink fill in from the left.
          gsap.set(lines, {
            backgroundImage: `linear-gradient(to right, ${ink} 50%, ${gray} 50%)`,
            backgroundSize: '200% 100%',
            backgroundPositionX: '100%',
            backgroundClip: 'text',
            webkitBackgroundClip: 'text',
            color: 'transparent',
          })

          // Pin the section: scrolling fills the lines top to bottom, holds
          // a beat, then inverts to the footer palette before unpinning.
          fillTl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=300%',
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })

          // Phase 1: every line fills gray → dark, top to bottom.
          fillTl.to(lines, {
            backgroundPositionX: '0%',
            duration: 1,
            ease: 'none',
            stagger: 0.5,
          })

          // Phase 2: the fully dark text flips dark → light while the
          // background darkens to match the footer.
          fillTl
            .to(
              section,
              { backgroundColor: ink, ease: 'power1.inOut', duration: 2.5 },
              '+=0.4',
            )
            .to(
              lines,
              {
                backgroundImage: `linear-gradient(to right, ${cream} 50%, ${gray} 50%)`,
                ease: 'power1.inOut',
                duration: 2.5,
              },
              '<',
            )
        },
      })

      return () => {
        killTimeline()
        split.revert()
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      id='manifesto'
      className='relative flex min-h-screen w-full flex-col items-center justify-center bg-cream px-6 text-center md:px-[5vw]'
    >
      <p
        className='manifesto-text mt-[5vh] font-display font-medium leading-[1.1]'
        style={{ fontSize: 'clamp(2.25rem, 5vw, 5rem)' }}
      >
        Great products feel inevitable.
      </p>

      <div className='mt-[5vh]'>
        <p
          className='manifesto-text font-display leading-[1.3]'
          style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2.6rem)' }}
        >
          They don’t overwhelm.
        </p>
        <p
          className='manifesto-text font-display leading-[1.3]'
          style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2.6rem)' }}
        >
          They don’t explain themselves.
        </p>
        <p
          className='manifesto-text font-display leading-[1.3]'
          style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2.6rem)' }}
        >
          They simply work.
        </p>
      </div>

      <p
        className='manifesto-text mx-auto mt-[6vh] max-w-[46rem] font-sans leading-[1.5]'
        style={{ fontSize: 'clamp(1.05rem, 1.4vw, 1.5rem)' }}
      >
        I strive to create digital experiences that are clear, fast, and
        quietly memorable—where thoughtful design and reliable engineering
        become indistinguishable.
      </p>
    </section>
  )
}
