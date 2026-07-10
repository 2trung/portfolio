import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three/webgpu'
import {
  Fn,
  clamp,
  float,
  int,
  mix,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  uniformArray,
  vec2,
} from 'three/tsl'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { LiquidFlow } from './liquidFlow'

gsap.registerPlugin(ScrollTrigger)

// Concrete TSL node type — `uniformArray(...).element()` is typed too loosely
// to chain math onto, so we narrow the element back to its real shape.
type FloatNode = ReturnType<typeof float>

// `scene.backgroundNode` isn't on the base three type surface exposed through
// R3F, so we widen the scene locally where we assign it.
type NodeScene = THREE.Scene & { backgroundNode: unknown }

const CELLS = 16
const DITHER_STATES: number[][] = [
  [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
]
const STATE_COUNT = DITHER_STATES.length

interface DitherControls {
  pixelSize: number
  baseOpacity: number
  maxOpacity: number
  revealFrom: number
  waveY: number
  waveWidth: number
  waveAmp: number
  waveFreq: number
  waveSpeed: number
  waveFade: number
  waveStrength: number
  flowStrength: number
  intensity: number
  radius: number
  momentum: number
  colorBg: string
  colorFg: string
  colorAccent: string
}

/** The stable set of uniform nodes that drive the material. */
function createUniforms(c: DitherControls) {
  return {
    pixelSize: uniform(c.pixelSize),
    baseOpacity: uniform(c.baseOpacity),
    maxOpacity: uniform(c.maxOpacity),
    revealFrom: uniform(c.revealFrom),
    waveY: uniform(c.waveY),
    waveWidth: uniform(c.waveWidth),
    waveAmp: uniform(c.waveAmp),
    waveFreq: uniform(c.waveFreq),
    waveSpeed: uniform(c.waveSpeed),
    waveFade: uniform(c.waveFade),
    waveStrength: uniform(c.waveStrength),
    flowStrength: uniform(c.flowStrength),
    colorBg: uniform(new THREE.Color(c.colorBg)),
    colorFg: uniform(new THREE.Color(c.colorFg)),
    colorAccent: uniform(new THREE.Color(c.colorAccent)),
    // Scroll-driven, not Leva-tuned — hides the dither over the About section.
    visibility: uniform(1),
  }
}

type Uniforms = ReturnType<typeof createUniforms>

/**
 * Compile the reveal + dither + liquid-flow graph into a single screen-space
 * color node. It reads `screenUV`/`screenCoordinate`, so it's independent of
 * the camera and can serve as the scene background behind everything else.
 */
function buildBackgroundNode(u: Uniforms, liquidTex: THREE.Texture) {
  // Flatten every state into one [state * 16 + cell] lookup table.
  const states = uniformArray(DITHER_STATES.flat(), 'float')
  const liquidField = texture(liquidTex)

  const fragment = Fn(() => {
    // screenUV is top-left origin here; flip to a bottom-left Y so "bottom"
    // means y → 0 for both the wave and the liquid field.
    const uvy = float(1).sub(screenUV.y)

    // opcity
    const opacity = u.baseOpacity.toVar()

    // sin wave
    const waveLine = u.waveY.add(
      sin(screenUV.x.mul(u.waveFreq).add(time.mul(u.waveSpeed))).mul(u.waveAmp),
    )
    const center = waveLine.sub(u.waveWidth.mul(0.5))
    const reach = u.waveWidth.mul(0.5).add(u.waveFade)
    const dist = uvy.sub(center).abs()
    const waveOp = smoothstep(reach, float(0), dist)
    opacity.addAssign(waveOp.mul(u.waveStrength))

    // Liquid flow
    const flowUV = vec2(screenUV.x, uvy)
    const t = float(1 / 128)
    const nt = float(-1 / 128)
    const liquid = liquidField
      .sample(flowUV)
      .x.add(liquidField.sample(flowUV.add(vec2(t, float(0)))).x)
      .add(liquidField.sample(flowUV.add(vec2(float(0), t))).x)
      .add(liquidField.sample(flowUV.add(vec2(nt, float(0)))).x)
      .add(liquidField.sample(flowUV.add(vec2(float(0), nt))).x)
      .mul(float(0.2))
    // adds opacity and color.
    const chr = smoothstep(float(0), float(0.1), liquid)
    opacity.addAssign(chr.mul(u.flowStrength))

    const op = clamp(opacity, float(0), float(1))

    const reveal = clamp(
      op.sub(u.revealFrom).div(float(1).sub(u.revealFrom)),
      float(0),
      float(1),
    )
    const state = int(
      clamp(reveal.mul(STATE_COUNT).floor(), float(0), float(STATE_COUNT - 1)),
    )

    const cell = screenCoordinate.div(u.pixelSize).floor()
    const bx = int(cell.x.mod(4))
    const by = int(float(3).sub(cell.y.mod(4)))
    const cellIndex = bx.add(by.mul(int(4)))
    const on = states.element(
      state.mul(int(CELLS)).add(cellIndex),
    ) as unknown as FloatNode

    const lit = mix(u.colorFg, u.colorAccent, chr)
    const cover = on.mul(reveal).mul(u.maxOpacity).mul(u.visibility)
    return mix(u.colorBg, lit, cover)
  })

  return fragment()
}

/** Mirror the current Leva values onto the live uniform nodes. */
function syncUniforms(u: Uniforms, c: DitherControls): void {
  u.pixelSize.value = c.pixelSize
  u.baseOpacity.value = c.baseOpacity
  u.maxOpacity.value = c.maxOpacity
  u.revealFrom.value = c.revealFrom
  u.waveY.value = c.waveY
  u.waveWidth.value = c.waveWidth
  u.waveAmp.value = c.waveAmp
  u.waveFreq.value = c.waveFreq
  u.waveSpeed.value = c.waveSpeed
  u.waveFade.value = c.waveFade
  u.waveStrength.value = c.waveStrength
  u.flowStrength.value = c.flowStrength
  u.colorBg.value.set(c.colorBg)
  u.colorFg.value.set(c.colorFg)
  u.colorAccent.value.set(c.colorAccent)
}

export default function DitherBackground() {
  const controls = useControls('Dither', {
    pixelSize: { value: 2, min: 1, max: 10, step: 1 },
    baseOpacity: { value: 0, min: 0, max: 1, step: 0.01 },
    maxOpacity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    revealFrom: { value: 0.5, min: 0, max: 0.95, step: 0.01 },
    waveY: { value: 1.0, min: 0, max: 5, step: 0.01 },
    waveWidth: { value: 1.0, min: 0.01, max: 3, step: 0.01 },
    waveAmp: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
    waveFreq: { value: 3.5, min: 0, max: 40, step: 0.5 },
    waveSpeed: { value: 1.0, min: 0, max: 5, step: 0.1 },
    waveFade: { value: 1, min: 0.01, max: 3, step: 0.01 },
    waveStrength: { value: 0.6, min: 0, max: 1.5, step: 0.05 },
    flowStrength: { value: 1.5, min: 0, max: 3, step: 0.05 },
    intensity: { value: 1.3, min: 0.5, max: 1.5, step: 0.1 },
    radius: { value: 3, min: 0, max: 5, step: 0.1 },
    momentum: { value: 30, min: 10, max: 60, step: 1 },
    colorBg: '#0e0d0c',
    colorFg: '#f5f2ed',
    colorAccent: '#ffffff',
  }) as DitherControls

  const scene = useThree((s) => s.scene)

  // Background color node + the liquid-flow sim
  const { u, node, sim } = useMemo(() => {
    const uniforms = createUniforms(controls)
    const s = new LiquidFlow()
    return {
      u: uniforms,
      node: buildBackgroundNode(uniforms, s.liquidTexture),
      sim: s,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pointer = useRef({ x: 0, y: 0 })

  // Install the dither as the scene background; restore on unmount.
  useEffect(() => {
    // Imperatively swap the scene background node — an intentional side effect
    // on the R3F-owned scene, so the immutability lint doesn't apply.
    /* eslint-disable react-hooks/immutability */
    const target = scene as NodeScene
    const prev = target.backgroundNode
    target.backgroundNode = node
    return () => {
      target.backgroundNode = prev ?? null
    }
    /* eslint-enable react-hooks/immutability */
  }, [scene, node])

  useEffect(() => syncUniforms(u, controls), [u, controls])
  useEffect(() => () => sim.dispose(), [sim])

  // Fade the dither out just after phase 1 of the opening sequence (the
  // shutter is closed by then, so the swap is invisible) and keep it hidden,
  // giving the About reveal a clean dark backdrop.
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('#opening')
    if (!section) return

    const ctx = gsap.context(() => {
      // Scrubbed over the same scroll range as the opening timeline; the
      // positions below mirror its 4.7-unit clock (phase 1 ends at t = 1).
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      tl.to(u.visibility, { value: 0, duration: 0.4, ease: 'power2.out' }, 1)
      // Zero-length placeholder pads the timeline out to the opening's full
      // 4.7 units so the tween above lands at the same scroll fraction.
      tl.set({}, {}, 4.7)
    })

    return () => ctx.revert()
  }, [u])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth
      pointer.current.y = 1 - e.clientY / window.innerHeight
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, dt) => {
    const aspect = window.innerWidth / window.innerHeight
    sim.update(pointer.current.x, pointer.current.y, aspect, dt, {
      intensity: controls.intensity,
      radius: controls.radius,
      momentum: controls.momentum,
    })
  })

  return null
}
