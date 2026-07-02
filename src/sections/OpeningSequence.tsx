import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './Hero'
import PixelHand from '../components/PixelHand'

gsap.registerPlugin(ScrollTrigger)

const MASK_COLOR = '#0c0b0a'

const HELLOS = [
  'HELLO',
  'XIN CHÀO',
  'HOLA',
  'BONJOUR',
  'CIAO',
  'HALLO',
  'OLÁ',
  'こんにちは',
  '안녕하세요',
  'ПРИВЕТ',
]
const MANIFESTO = [
  'CRAFTING BOLD MEMORABLE WEBSITES',
  'PIXELS IN MOTION',
  'MOTION WITH MEANING',
  'CODE WITH LOVE',
]

function segments(items: string[]) {
  return items.map((text, i) => (
    <span key={i} className='inline-flex items-center whitespace-nowrap'>
      <span className='px-[0.7em]'>{text}</span>
      <span className='text-red' aria-hidden>
        ✳
      </span>
    </span>
  ))
}

interface MarqueeProps {
  children: ReactNode
  reverse?: boolean
}

function Marquee({ children, reverse = false }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const track = trackRef.current!
    const group = groupRef.current!
    const ctx = gsap.context(() => {
      const pxPerSec = 55
      const duration = group.getBoundingClientRect().width / pxPerSec || 20
      gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration, ease: 'none', repeat: -1 },
      )
    }, track)
    return () => ctx.revert()
  }, [reverse])

  return (
    <div className='overflow-hidden'>
      <div ref={trackRef} className='flex w-max will-change-transform'>
        <div ref={groupRef} className='flex shrink-0'>
          {children}
        </div>
        <div className='flex shrink-0' aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

interface OpeningSequenceProps {
  revealed: boolean
}

export default function OpeningSequence({ revealed }: OpeningSequenceProps) {
  const track = useRef<HTMLElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const window_ = useRef<HTMLDivElement>(null)
  const darken = useRef<HTMLDivElement>(null)
  const leftHandRef = useRef<HTMLDivElement>(null)
  const rightHandRef = useRef<HTMLDivElement>(null)
  const topTextRef = useRef<HTMLDivElement>(null)
  const bottomTextRef = useRef<HTMLDivElement>(null)

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

      const portrait = window.innerHeight / window.innerWidth > 1.25
      const tilt = portrait ? 45 : 0
      const lift = portrait ? 45 : 0
      // On small/portrait screens the hands rotate, so their bounding box
      // shrinks diagonally — scale them up to keep covering the frame.
      const grow = portrait ? 1.6 : 1
      const hideX = portrait ? 175 : 120
      // Left hand moves UP, right hand moves DOWN
      gsap.set(leftHandRef.current, {
        xPercent: -hideX,
        yPercent: -lift,
        rotation: tilt,
        scale: grow,
      })
      gsap.set(rightHandRef.current, {
        xPercent: hideX,
        yPercent: lift,
        rotation: tilt,
        scale: grow,
      })

      // Running-text bars
      gsap.set(topTextRef.current, { yPercent: -100 })
      gsap.set(bottomTextRef.current, { yPercent: 100 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
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

      // Phase 3: the 75° rotation turns the window from vertical to horizontal.
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

      // Hands slide in from the sides while the shutter covers the hero
      tl.fromTo(
        leftHandRef.current,
        { xPercent: -hideX },
        { xPercent: 0, ease: 'power2.out', duration: 2 },
        0.4,
      )
      tl.fromTo(
        rightHandRef.current,
        { xPercent: hideX },
        { xPercent: 0, ease: 'power2.out', duration: 2 },
        0.4,
      )

      // Running text
      tl.fromTo(
        topTextRef.current,
        { yPercent: -100 },
        { yPercent: 0, ease: 'power2.out', duration: 0.5 },
        0.8,
      )
      tl.fromTo(
        bottomTextRef.current,
        { yPercent: 100 },
        { yPercent: 0, ease: 'power2.out', duration: 0.5 },
        0.8,
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

        {/* Left hand */}
        <div className='pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center'>
          <div ref={leftHandRef} className='will-change-transform'>
            <PixelHand src='/images/left.png' side='left' />
          </div>
        </div>

        {/* Right hand */}
        <div className='pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center'>
          <div ref={rightHandRef} className='will-change-transform'>
            <PixelHand src='/images/right.png' side='right' />
          </div>
        </div>

        {/* Top running text */}
        <div
          ref={topTextRef}
          className='pointer-events-none absolute inset-x-0 top-0 z-30 py-[0.5vh] font-display text-[clamp(3rem,5vw,6rem)] uppercase leading-none tracking-[0.01em] text-cream will-change-transform'
        >
          <Marquee reverse>{segments(HELLOS)}</Marquee>
        </div>

        {/* Bottom running text */}
        <div
          ref={bottomTextRef}
          className='pointer-events-none absolute inset-x-0 bottom-0 z-30 py-[0.5vh] font-display text-[clamp(3rem,5vw,6rem)] uppercase leading-none tracking-[0.01em] text-cream will-change-transform'
        >
          <Marquee>{segments(MANIFESTO)}</Marquee>
        </div>
      </div>
    </section>
  )
}
