import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Tech {
  name: string
  logo: string
}

const TECHS: Tech[] = [
  { name: 'Three.js', logo: '/images/tech/threejs.svg' },
  { name: 'GSAP', logo: '/images/tech/gsap.svg' },
  { name: 'Blender', logo: '/images/tech/blender.svg' },
  { name: 'Figma', logo: '/images/tech/figma.svg' },
  { name: 'JavaScript', logo: '/images/tech/javascript.svg' },
  { name: 'TypeScript', logo: '/images/tech/typescript.svg' },
  { name: 'Java', logo: '/images/tech/java.svg' },
  { name: 'Docker', logo: '/images/tech/docker.svg' },
  { name: 'AWS', logo: '/images/tech/aws.svg' },
  { name: 'React', logo: '/images/tech/react.svg' },
  { name: 'Next.js', logo: '/images/tech/nextjs.svg' },
  { name: 'Tailwind', logo: '/images/tech/tailwindcss.svg' },
  { name: 'Vite', logo: '/images/tech/vite.svg' },
  { name: 'Claude', logo: '/images/tech/claude.svg' },
]

export default function TechStack() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const row = root.current!.querySelector<HTMLElement>('.techstack-row')!
      const title =
        root.current!.querySelector<HTMLElement>('.techstack-title')!
      const bounceEase = gsap.parseEase('sine.inOut(0.5)')
      const ZOOM = 0.6 // extra scale at the middle of the screen
      gsap.set(row, { yPercent: -50 })
      const applyStream = () => {
        const vw = window.innerWidth
        const titleRect = title.getBoundingClientRect()
        const titleCx = titleRect.left + titleRect.width / 2
        const titleCy = titleRect.top + titleRect.height / 2
        const halfW = titleRect.width / 2 + 40
        const falloff = Math.max(220, titleRect.width * 0.35)
        const rowRect = row.getBoundingClientRect()
        const rowCy = rowRect.top + rowRect.height / 2

        const writes: Array<() => void> = []

        Array.from(row.children).forEach((item, i) => {
          const dir = i % 2 === 0 ? -1 : 1
          const rect = item.getBoundingClientRect()
          const itemCx = rect.left + rect.width / 2

          const t = gsap.utils.clamp(
            0,
            1,
            (Math.abs(itemCx - titleCx) - halfW) / falloff,
          )
          const k = bounceEase(1 - t)

          const mid = gsap.utils.clamp(
            0,
            1,
            1 - Math.abs(itemCx - vw / 2) / (vw / 2),
          )
          const scale = 1 + ZOOM * bounceEase(1 - (1 - mid) ** 2)

          const clearance =
            titleRect.height / 2 + (rowRect.height / 2) * scale + 28
          const amp = Math.max(0, clearance - Math.abs(rowCy - titleCy))
          const y = dir * amp * k

          writes.push(() => gsap.set(item, { y, scale }))
        })
        writes.forEach((write) => write())
      }

      const tl = gsap.timeline({
        onUpdate: applyStream,
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onRefresh: applyStream,
        },
      })

      tl.fromTo(
        row,
        { x: () => window.innerWidth },
        { x: () => -(row.offsetWidth + 160), ease: 'none', duration: 1 },
        0,
      )

      gsap.from('.techstack-title', {
        opacity: 0,
        yPercent: 30,
        duration: reduce ? 0.4 : 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
          invalidateOnRefresh: true,
        },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      id='techstack'
      className='relative mt-[-100vh] h-screen w-full bg-black p-[2vh]'
    >
      <div className='relative h-full w-full overflow-hidden rounded-4xl bg-cream'>
        <div className='flex h-full w-full items-center justify-center'>
          <h2
            className='techstack-title relative z-10 font-display leading-none text-ink'
            style={{ fontSize: 'clamp(2.5rem, 7.5vw, 8rem)' }}
          >
            Techstack
          </h2>
        </div>

        <div className='techstack-row absolute left-0 top-1/2 flex items-center gap-12 will-change-transform'>
          {TECHS.map((tech) => (
            <div
              key={tech.name}
              className='techstack-item flex shrink-0 flex-col items-center gap-3 will-change-transform'
            >
              <img
                src={tech.logo}
                alt={tech.name}
                draggable={false}
                className='h-14 w-14 object-contain md:h-20 md:w-20'
              />
              <span className='font-sans text-xs uppercase tracking-[0.2em] text-gray'>
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
