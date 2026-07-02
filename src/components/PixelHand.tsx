import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const COLS = 120 // Grid resolution (columns)
const CELL = 7 // logical px per pixel-cell (canvas is COLS*CELL wide)
const ALPHA_CUTOFF = 20 // Threshold for ignoring transparent pixels

// Responsive display width
const DISPLAY_WIDTH = 'clamp(220px, 40vw, 720px)'

// Pixel colour constants
const BASE = { r: 245, g: 242, b: 237 } // cream #f5f2ed
const TWINKLE = { r: 255, g: 255, b: 255 } // white — twinkle peak
const ACCENT = { r: 238, g: 51, b: 53 } // red #ee3335 — hover colour
const INK = 'rgb(33,31,31)' // ink #211f1f — hover texture colour
const ZOOM = 0.9 // extra size a fully-lit pixel gains

// Hover texture
const GLYPHS = ' .:-=+*#%@'

// Base pixel size
const PIX_MIN = 0.12 // darkest source pixel
const PIX_MAX = 1.17 // brightest source pixel

// Hover
const HOVER_RADIUS = 2.5
const HOVER_LIFETIME = 220 // ms a hovered cell stays lit

// Twinkle: a cell ramps to its new size, HOLDS there, then eases back. attack + hold + release = full lifetime.
const SPARKLE_ATTACK = 140 // ms to reach the new size
const SPARKLE_HOLD = 650 // ms it keeps the new size
const SPARKLE_RELEASE = 450 // ms to ease back to normal
const SPARKLE_LIFETIME = SPARKLE_ATTACK + SPARKLE_HOLD + SPARKLE_RELEASE
const SPARKLE_RATE = 0.4 // expected ignitions per cell per second

interface Cell {
  col: number
  row: number
  lum: number // 0..1 sampled luminance — drives base pixel size
  glyph: string // hover texture char (denser for brighter source)
  noise: number // per-cell hover-radius jitter (matches AsciiHand)
  phase: number // per-cell breathing offset
  speed: number // per-cell breathing speed
  hitTime: number // last hover hit (ms)
  sparkleTime: number // last ambient sparkle ignition (ms)
  sparkleDir: number // +1 grow / -1 shrink for the current sparkle
}

// Seeded rand so cell phases are deterministic across mounts.
function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function sampleCells(img: HTMLImageElement) {
  const rows = Math.max(
    1,
    Math.round(COLS * (img.naturalHeight / img.naturalWidth)),
  )
  const c = document.createElement('canvas')
  c.width = COLS
  c.height = rows
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, COLS, rows)
  const px = ctx.getImageData(0, 0, COLS, rows).data

  const rand = makeRand(1337)
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = (row * COLS + col) * 4
      const a = px[i + 3]
      if (a < ALPHA_CUTOFF) continue
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
      // Same seeded hash AsciiHand uses to jitter the hover radius.
      const h =
        (((Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1) + 1) % 1
      const gi = Math.min(GLYPHS.length - 1, Math.floor(lum * GLYPHS.length))
      cells.push({
        col,
        row,
        lum,
        glyph: GLYPHS[gi],
        noise: h * 5 - 2.5,
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 1.4,
        hitTime: 0,
        sparkleTime: 0,
        sparkleDir: 1,
      })
    }
  }
  return { cells, rows }
}

interface PixelHandProps {
  src: string
  side: 'left' | 'right'
  className?: string
}

export default function PixelHand({ src, side, className }: PixelHandProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Twinkle render loop
  useEffect(() => {
    const canvas = canvasRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')!

    let cells: Cell[] = []
    let rows = 0
    let cssW = 0
    let cssH = 0
    let start = 0
    let last = 0
    let running = false

    const img = new Image()
    img.src = src

    const tick = () => {
      const t = gsap.ticker.time
      if (start === 0) start = t
      const elapsed = (t - start) * 1000 // ms since mount
      const dt = Math.min(t - last, 0.016) // frame delta cap
      last = t
      const now = performance.now()

      ctx.clearRect(0, 0, cssW, cssH)

      // Probability a given cell ignites an ambient sparkle this frame
      const igniteP = SPARKLE_RATE * dt

      for (let k = 0; k < cells.length; k++) {
        const cell = cells[k]

        // Random direction so a twinkle can grow the pixel or shrink it
        if (Math.random() < igniteP) {
          cell.sparkleTime = now
          cell.sparkleDir = Math.random() < 0.5 ? 1 : -1
        }

        // Breathing: subtle size oscillation keyed to luminance.
        const breathe =
          0.85 + 0.15 * Math.sin(cell.phase + elapsed * 0.001 * cell.speed)

        // Twinkle envelope: ramp up → hold at 1 → ease back to 0
        const sAge = now - cell.sparkleTime
        let sparkle = 0
        if (cell.sparkleTime > 0 && sAge < SPARKLE_LIFETIME) {
          if (sAge < SPARKLE_ATTACK) sparkle = sAge / SPARKLE_ATTACK
          else if (sAge < SPARKLE_ATTACK + SPARKLE_HOLD) sparkle = 1
          else
            sparkle =
              1 - (sAge - SPARKLE_ATTACK - SPARKLE_HOLD) / SPARKLE_RELEASE
        }

        // Hover envelope (0..1, decaying) — dominates when active.
        const hAge = now - cell.hitTime
        const hover =
          cell.hitTime > 0 && hAge < HOVER_LIFETIME
            ? 1 - hAge / HOVER_LIFETIME
            : 0

        const depth = cell.lum
        const base = PIX_MIN + depth * (PIX_MAX - PIX_MIN) // small → large

        const twinkle = Math.max(0.1, 1 + sparkle * cell.sparkleDir * ZOOM)
        const sized = Math.min(base * breathe * twinkle, PIX_MAX)
        // Hover zoom applies on top of the capped twinkle
        const size = CELL * sized * (1 + hover * ZOOM)
        const half = Math.min(size, CELL * 1.9) / 2

        const cx = cell.col * CELL + CELL / 2
        const cy = cell.row * CELL + CELL / 2

        if (hover > 0) {
          ctx.fillStyle = `rgb(${ACCENT.r},${ACCENT.g},${ACCENT.b})`
          ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
          ctx.fillStyle = INK
          ctx.font = `${(half * 2.4) | 0}px monospace`
          ctx.fillText(cell.glyph, cx, cy)
        } else {
          const r = BASE.r + (TWINKLE.r - BASE.r) * sparkle
          const g = BASE.g + (TWINKLE.g - BASE.g) * sparkle
          const b = BASE.b + (TWINKLE.b - BASE.b) * sparkle
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
          ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
        }
      }
    }

    const init = () => {
      const sampled = sampleCells(img)
      cells = sampled.cells
      rows = sampled.rows
      cssW = COLS * CELL
      cssH = rows * CELL
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
      canvas.style.width = DISPLAY_WIDTH
      canvas.style.height = 'auto'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (!running) {
        running = true
        gsap.ticker.add(tick)
      }
    }

    if (img.complete && img.naturalWidth) init()
    else img.addEventListener('load', init)

    const onMouseMove = (e: MouseEvent) => {
      if (!cells.length) return
      const rect = canvas.getBoundingClientRect()
      const mxC = ((e.clientX - rect.left) / rect.width) * COLS
      const myC = ((e.clientY - rect.top) / rect.height) * rows
      const now = performance.now()
      for (let k = 0; k < cells.length; k++) {
        const cell = cells[k]
        const dx = cell.col - mxC
        const dy = cell.row - myC
        const r = HOVER_RADIUS + cell.noise
        if (dx * dx + dy * dy < r * r) cell.hitTime = now
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      img.removeEventListener('load', init)
      if (running) gsap.ticker.remove(tick)
    }
  }, [src])

  // Mouse parallax
  useEffect(() => {
    const canvas = canvasRef.current!
    let mx = 0
    let my = 0
    let sx = 0
    let sy = 0

    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = () => {
      sx += (mx - sx) * 0.05
      sy += (my - sy) * 0.05
      const px =
        side === 'left' ? Math.min(0, sx * -15 - 15) : Math.max(0, sx * 15 + 15)
      const py = sy * -10
      gsap.set(canvas, { x: px, y: py })
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      gsap.ticker.remove(tick)
    }
  }, [side])

  return (
    <div className={className}>
      <canvas ref={canvasRef} className='select-none will-change-transform' />
    </div>
  )
}
