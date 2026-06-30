import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './Hero'

gsap.registerPlugin(ScrollTrigger)

const MASK_COLOR = '#0c0b0a'

interface OpeningSequenceProps {
  revealed: boolean
}

export default function OpeningSequence({ revealed }: OpeningSequenceProps) {
  const track = useRef<HTMLElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const window_ = useRef<HTMLDivElement>(null)
  const darken = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const halfWidthPhase1 = 5
      const halfHeightPhase1 = 35
      const finalBarW = () => Math.min(window.innerWidth * 0.45, 220)
      const finalBarH = () => 24
      const halfWindow = {
        hw: window.innerWidth / 2,
        hh: window.innerHeight / 2,
      }

      const applyMask = () => {
        gsap.set(window_.current, {
          width: 2 * halfWindow.hw,
          height: 2 * halfWindow.hh,
        })
      }
      applyMask()

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true, // re-evaluate the px end values on resize
        },
        onUpdate: applyMask,
      })

      // Phase 1: close left + right to hide the hero (HW1% wide) and dim it.
      tl.to(
        halfWindow,
        {
          hw: () => window.innerWidth * (halfWidthPhase1 / 100),
          ease: 'power2.inOut',
          duration: 1,
        },
        0,
      )
      tl.to(darken.current, { opacity: 1, ease: 'power1.in', duration: 0.8 }, 0)

      // Phase 2: nudge the top + bottom in a little.
      tl.to(
        halfWindow,
        {
          hh: () => window.innerHeight * (halfHeightPhase1 / 100),
          ease: 'power2.inOut',
          duration: 0.2,
        },
        0.8,
      )

      // Phase 3: the 75° rotation turns the window from vertical to horizontal, so the window's WIDTH
      // (hw) becomes the bar's HEIGHT and its HEIGHT (hh) becomes the bar's WIDTH.
      tl.to(
        halfWindow,
        { hw: () => finalBarH() / 2, ease: 'power2.inOut', duration: 0.75 },
        1,
      )
      tl.to(
        halfWindow,
        { hh: () => finalBarW() / 2, ease: 'power2.inOut', duration: 0.75 },
        1,
      )
      tl.to(
        screen.current,
        { rotation: 75, ease: 'power2.inOut', duration: 1 },
        1,
      )
    }, track)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={track} className='relative h-[300vh] w-full'>
      <div className='sticky top-0 h-screen w-full overflow-hidden'>
        {/* The hero "screen" + the box-shadow mask that hides it. */}
        <div
          ref={screen}
          className='absolute inset-0 z-10 origin-center will-change-transform'
        >
          <Hero revealed={revealed} />

          {/* Dims the hero as it closes. */}
          <div
            ref={darken}
            className='pointer-events-none absolute inset-0 bg-black opacity-0'
          />

          {/* The lit window. Its giant box-shadow blacks out everything around
              it — resize the element and the "shutter" follows. */}
          <div
            ref={window_}
            className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-[width,height]'
            style={{ boxShadow: `0 0 0 9999px ${MASK_COLOR}` }}
          />
        </div>
      </div>
    </section>
  )
}
