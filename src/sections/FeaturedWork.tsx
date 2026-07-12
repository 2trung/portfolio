import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

interface Project {
  name: string
  category: string
  services: string
  year: string
  image: string
}

const PROJECTS: Project[] = [
  {
    name: 'Lumen Studio',
    category: 'E-commerce',
    services: 'Design & Development',
    year: '2026',
    image: '/images/projects/lumen.svg',
  },
  {
    name: 'Nordwind',
    category: 'Brand Site',
    services: 'Creative Development',
    year: '2025',
    image: '/images/projects/nordwind.svg',
  },
  {
    name: 'Atlas Analytics',
    category: 'SaaS Platform',
    services: 'Frontend Engineering',
    year: '2025',
    image: '/images/projects/atlas.svg',
  },
  {
    name: 'Meridian Hotels',
    category: 'Hospitality',
    services: 'Design & Development',
    year: '2024',
    image: '/images/projects/meridian.svg',
  },
  {
    name: 'Pulse Records',
    category: 'Music & Culture',
    services: 'WebGL Development',
    year: '2024',
    image: '/images/projects/pulse.svg',
  },
]

const GRID =
  'grid grid-cols-[1fr_auto] items-center gap-x-[4vw] md:grid-cols-[2.2fr_1fr_1.2fr_auto] md:gap-x-[2vw]'

export default function FeaturedWork() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const section = root.current!
      const preview =
        section.querySelector<HTMLElement>('.featured-preview')!
      const table = section.querySelector<HTMLElement>('.featured-table')!
      const images = gsap.utils.toArray<HTMLElement>(
        '.featured-preview-img',
        section,
      )
      const rows = gsap.utils.toArray<HTMLElement>('.featured-row', section)

      gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.85 })

      const xTo = gsap.quickTo(preview, 'x', { duration: 0.55, ease: 'power3' })
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.55, ease: 'power3' })
      const rotTo = gsap.quickTo(preview, 'rotation', {
        duration: 0.55,
        ease: 'power3',
      })
      const scaleTo = gsap.quickTo(preview, 'scale', {
        duration: 0.4,
        ease: 'power3.out',
      })
      const fadeTo = gsap.quickTo(preview, 'opacity', {
        duration: 0.3,
        ease: 'power2.out',
      })

      const localPoint = (e: MouseEvent) => {
        const r = section.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
      }

      let lastClientX = 0
      const onMove = (e: MouseEvent) => {
        const { x, y } = localPoint(e)
        xTo(x)
        yTo(y)
        rotTo(gsap.utils.clamp(-6, 6, (e.clientX - lastClientX) * 0.35))
        lastClientX = e.clientX
      }

      // Snap the preview to the cursor before it fades in, so the first
      // hover doesn't ease in from a stale position.
      const onTableEnter = (e: MouseEvent) => {
        const { x, y } = localPoint(e)
        gsap.set(preview, { x, y })
        lastClientX = e.clientX
      }

      const onTableLeave = () => {
        scaleTo(0.85)
        fadeTo(0)
      }

      const rowHandlers = rows.map((row, i) => {
        const onEnter = () => {
          images.forEach((img, j) => gsap.set(img, { opacity: j === i ? 1 : 0 }))
          scaleTo(1)
          fadeTo(1)
        }
        row.addEventListener('mouseenter', onEnter)
        return onEnter
      })

      section.addEventListener('mousemove', onMove)
      table.addEventListener('mouseenter', onTableEnter)
      table.addEventListener('mouseleave', onTableLeave)

      return () => {
        section.removeEventListener('mousemove', onMove)
        table.removeEventListener('mouseenter', onTableEnter)
        table.removeEventListener('mouseleave', onTableLeave)
        rows.forEach((row, i) =>
          row.removeEventListener('mouseenter', rowHandlers[i]),
        )
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      id='featured'
      className='relative h-full min-h-screen w-full overflow-hidden bg-ink text-cream'
    >
      {/* Title bar — stays put; the table scrolls up and hides beneath it */}
      <div className='featured-titlebar relative z-20 bg-ink px-6 pb-[2vh] pt-[5vh] md:px-[5vw]'>
        <h2
          className='featured-title flex w-full items-baseline justify-between font-display font-bold leading-none will-change-transform'
          style={{ fontSize: 'clamp(3rem, 12.5vw, 18rem)' }}
        >
          <span className='text-transparent [-webkit-text-stroke:0.02em_var(--color-cream)]'>
            Featured
          </span>
          <span>Work</span>
        </h2>

        <div
          className={`featured-head ${GRID} mt-[4vh] border-b border-cream/30 pb-3 font-sans text-sm uppercase tracking-[0.2em] text-gray will-change-transform`}
        >
          <span>Website</span>
          <span className='hidden md:block'>Category</span>
          <span className='hidden md:block'>Services</span>
          <span className='text-right'>Year</span>
        </div>
      </div>

      <div className='featured-table relative z-10 px-6 pb-[6vh] will-change-transform md:px-[5vw]'>
        {PROJECTS.map((project) => (
          <div
            key={project.name}
            className={`featured-row group ${GRID} cursor-pointer border-b border-cream/15 py-[3vh] will-change-transform`}
          >
            <div className='min-w-0'>
              <span
                className='block font-display leading-none text-cream/80 transition-[color,transform] duration-300 group-hover:translate-x-2 group-hover:text-cream'
                style={{ fontSize: 'clamp(1.75rem, 3.6vw, 4.25rem)' }}
              >
                {project.name}
              </span>
              <span className='mt-2 block font-sans text-xs uppercase tracking-[0.15em] text-cream/40 md:hidden'>
                {project.category} · {project.services}
              </span>
            </div>
            <span
              className='hidden font-sans text-cream/50 transition-colors duration-300 group-hover:text-cream md:block'
              style={{ fontSize: 'clamp(1rem, 1.2vw, 1.4rem)' }}
            >
              {project.category}
            </span>
            <span
              className='hidden font-sans text-cream/50 transition-colors duration-300 group-hover:text-cream md:block'
              style={{ fontSize: 'clamp(1rem, 1.2vw, 1.4rem)' }}
            >
              {project.services}
            </span>
            <span
              className='text-right font-sans text-cream/50 transition-colors duration-300 group-hover:text-cream'
              style={{ fontSize: 'clamp(1rem, 1.2vw, 1.4rem)' }}
            >
              {project.year}
            </span>
          </div>
        ))}
      </div>

      {/* Cursor-following project preview — driven by quickTo, hidden until a row is hovered */}
      <div
        className='featured-preview pointer-events-none absolute left-0 top-0 z-30 overflow-hidden rounded-lg opacity-0 will-change-transform'
        style={{ width: 'clamp(240px, 26vw, 420px)', aspectRatio: '4 / 3' }}
      >
        {PROJECTS.map((project) => (
          <img
            key={project.name}
            src={project.image}
            alt={project.name}
            draggable={false}
            className='featured-preview-img absolute inset-0 h-full w-full object-cover opacity-0'
          />
        ))}
      </div>
    </section>
  )
}
