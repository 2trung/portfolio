import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Character pools — index 0 = lightest, 7 = densest
const POOLS = [
  ' ',
  '·.,',
  ':;`-~^',
  '=+<>?!:;',
  '|/\\()[]{}«»',
  '÷×±≈≠≤≥∞∑∏√∫',
  '¤†‡§¶©®™°¬',
  '%&#$@¥€£¢',
]

const COLS = 160
const HOVER_BG = '#ee3335' // red design token
const HOVER_FG = '#211f1f' // ink design token

// Seeded rand for deterministic char placement
function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function esc(ch: string) {
  if (ch === '<') return '&lt;'
  if (ch === '>') return '&gt;'
  if (ch === '&') return '&amp;'
  return ch
}

// charAspect = rendered char height / char width — corrects for monospace cells being ~2× taller than wide
function imageToAscii(img: HTMLImageElement, charAspect: number) {
  const rand = makeRand(42)
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const rows = Math.round((COLS * (img.height / img.width)) / charAspect)
  c.width = COLS
  c.height = rows
  ctx.drawImage(img, 0, 0, COLS, rows)
  const px = ctx.getImageData(0, 0, COLS, rows).data
  const lines: string[] = []
  const poolGrid: number[][] = []

  for (let y = 0; y < rows; y++) {
    let line = ''
    const pr: number[] = []
    for (let x = 0; x < COLS; x++) {
      const i = (y * COLS + x) * 4
      const a = px[i + 3]
      if (a < 15) {
        line += ' '
        pr.push(-1)
        continue
      }
      const brightness =
        ((0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255) *
        (a / 255)
      const pi = Math.min(
        Math.floor(brightness * (POOLS.length - 1) * 0.8),
        POOLS.length - 1,
      )
      const pool = POOLS[pi]
      line += pool[Math.floor(rand() * pool.length)]
      pr.push(pi)
    }
    lines.push(line)
    poolGrid.push(pr)
  }

  return { text: lines.join('\n'), poolGrid, rows }
}

interface AsciiHandProps {
  src: string
  side: 'left' | 'right'
  className?: string
}

export default function AsciiHand({ src, side, className }: AsciiHandProps) {
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const pre = preRef.current!
    const img = new Image()
    img.src = src

    let origText = ''
    let origGrid: string[][] = []
    let poolGrid: number[][] = []
    let rows = 0
    let noise: number[][] = []
    let hitTime: number[][] = []
    let cellDuration: number[][] = []
    let animating = false

    const init = () => {
      // Measure actual rendered char dimensions so row count preserves image aspect ratio.
      // Monospace cells are typically ~1.9× taller than wide; measuring directly is font-proof.
      pre.textContent = 'X'
      const charRect = pre.getBoundingClientRect()
      const charAspect = charRect.height / Math.max(charRect.width, 1)
      pre.textContent = ''

      const result = imageToAscii(img, charAspect)
      origText = result.text
      poolGrid = result.poolGrid
      rows = result.rows
      origGrid = origText.split('\n').map((l) => l.split(''))

      // Per-cell jitter: varies hover radius slightly and controls highlight duration
      noise = []
      hitTime = []
      cellDuration = []
      for (let ny = 0; ny < rows; ny++) {
        const nr: number[] = [],
          ht: number[] = [],
          cd: number[] = []
        for (let nx = 0; nx < COLS; nx++) {
          const h =
            (((Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453) % 1) + 1) % 1
          nr.push(h * 5 - 2.5)
          ht.push(0)
          cd.push(h > 0.5 ? 200 : 100)
        }
        noise.push(nr)
        hitTime.push(ht)
        cellDuration.push(cd)
      }

      pre.textContent = origText
    }

    if (img.complete && img.naturalWidth) init()
    else img.addEventListener('load', init)

    // Hover highlight — tick only runs while cells are active
    const tick = () => {
      const now = performance.now()
      let anyActive = false
      let html = ''

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < COLS; x++) {
          const pi = poolGrid[y][x]
          if (pi < 0 || pi === 0) {
            html += ' '
            continue
          }
          const elapsed = now - hitTime[y][x]
          if (hitTime[y][x] > 0 && elapsed < cellDuration[y][x]) {
            anyActive = true
            // Inverted pool: dark-area chars on light cells, light-area chars on dark
            const invertedPool = POOLS[POOLS.length - 1 - pi]
            const ch =
              invertedPool[Math.floor(Math.random() * invertedPool.length)]
            html += `<span style="color:${HOVER_FG};background:${HOVER_BG}">${esc(ch)}</span>`
          } else {
            html += esc(origGrid[y][x])
          }
        }
        html += '\n'
      }

      pre.innerHTML = html

      if (!anyActive) {
        animating = false
        gsap.ticker.remove(tick)
        pre.textContent = origText
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!origGrid.length) return
      const rect = pre.getBoundingClientRect()
      const charW = rect.width / COLS
      const charH = rect.height / rows
      const mxC = (e.clientX - rect.left) / charW
      const myC = (e.clientY - rect.top) / charH

      const RADIUS = 2.5
      const maxR = RADIUS + 3
      const now = performance.now()
      const yMin = Math.max(0, Math.floor(myC - maxR))
      const yMax = Math.min(rows - 1, Math.ceil(myC + maxR))
      const xMin = Math.max(0, Math.floor(mxC - maxR))
      const xMax = Math.min(COLS - 1, Math.ceil(mxC + maxR))

      for (let y = yMin; y <= yMax; y++) {
        for (let x = xMin; x <= xMax; x++) {
          const dx = x - mxC,
            dy = y - myC
          const r = RADIUS + noise[y][x]
          if (dx * dx + dy * dy < r * r) hitTime[y][x] = now
        }
      }

      if (!animating) {
        animating = true
        gsap.ticker.add(tick)
      }
    }

    const onMouseLeave = () => {
      /* let hitTime expire naturally */
    }

    // Attach to window so hover works even with pointer-events:none on wrapper
    window.addEventListener('mousemove', onMouseMove)
    pre.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      pre.removeEventListener('mouseleave', onMouseLeave)
      if (animating) gsap.ticker.remove(tick)
    }
  }, [src])

  // Smooth mouse parallax via GSAP ticker
  useEffect(() => {
    const pre = preRef.current!
    let mx = 0,
      my = 0,
      sx = 0,
      sy = 0

    const onMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = () => {
      sx += (mx - sx) * 0.05
      sy += (my - sy) * 0.05
      const px =
        side === 'left'
          ? Math.min(0, sx * -15 - 15) // left: always drifts leftward
          : Math.max(0, sx * 15 + 15) // right: always drifts rightward
      const py = sy * -10
      gsap.set(pre, { x: px, y: py })
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
      <pre
        ref={preRef}
        className='font-mono text-cream/70 select-none'
        style={{
          fontSize: '8px',
          lineHeight: '1.15',
          letterSpacing: '0.02em',
        }}
      />
    </div>
  )
}
