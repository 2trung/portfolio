import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three/webgpu'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Fn, positionGeometry, texture, uniform, uv, vec4 } from 'three/tsl'
import { useControls } from 'leva'
import { GridDistortion, type PointerState } from './gridDistortion'

// Mouse-driven pixel-grid distortion + chromatic aberration over an image.
// The <img> stays in the DOM as the layout element and no-WebGPU fallback;
// a small dedicated canvas overlays it and replicates its object-cover crop
// in the shader, so the swap is pixel-exact.

interface DistortedImageProps {
  src: string
  alt: string
  /** Extra classes for the underlying <img> (sizing / object-fit). */
  className?: string
}

interface DistortionControls {
  displacement: number
  aberration: number
  relaxation: number
  radius: number
  strength: number
}

function createUniforms(c: DistortionControls) {
  return {
    displacement: uniform(c.displacement),
    aberration: uniform(c.aberration),
    cover: uniform(new THREE.Vector2(1, 1)),
  }
}

type Uniforms = ReturnType<typeof createUniforms>

function buildMaterial(
  u: Uniforms,
  imageTex: THREE.Texture,
  fieldTex: THREE.DataTexture,
) {
  const material = new THREE.MeshBasicNodeMaterial()
  // Fullscreen quad straight in NDC — no camera involved.
  material.vertexNode = vec4(positionGeometry.x, positionGeometry.y, 0, 1)

  const image = texture(imageTex)
  const field = texture(fieldTex)

  material.colorNode = Fn(() => {
    // The field is sampled in container space; 128 encodes a zero offset.
    const offset = field.sample(uv()).rg.mul(255).sub(128).div(127)
    // Offsets are scaled by the cover crop so displacement stays proportional
    // to the visible slice of the image.
    const shift = offset.mul(u.displacement).mul(u.cover)
    const split = shift.mul(u.aberration)

    const base = uv().sub(0.5).mul(u.cover).add(0.5).sub(shift)
    const r = image.sample(base.add(split)).r
    const g = image.sample(base).g
    const b = image.sample(base.sub(split)).b
    return vec4(r, g, b, 1)
  })()

  return material
}

function syncUniforms(u: Uniforms, c: DistortionControls, motionScale: number): void {
  u.displacement.value = c.displacement * motionScale
  u.aberration.value = c.aberration
}

interface DistortionPlaneProps {
  src: string
  pointer: React.RefObject<PointerState>
}

function DistortionPlane({ src, pointer }: DistortionPlaneProps) {
  const controls = useControls('Footer image', {
    displacement: { value: 0.03, min: 0, max: 0.08, step: 0.001 },
    aberration: { value: 0.35, min: 0, max: 1, step: 0.01 },
    relaxation: { value: 0.925, min: 0.5, max: 0.99, step: 0.005 },
    radius: { value: 0.25, min: 0.05, max: 1, step: 0.01 },
    strength: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
  }) as DistortionControls

  const size = useThree((s) => s.size)
  const imageTex = useLoader(THREE.TextureLoader, src)

  const { u, material, sim } = useMemo(() => {
    // Imperative setup of the loader-owned texture before first compile — an
    // intentional side effect, so the immutability lint doesn't apply.
    /* eslint-disable react-hooks/immutability */
    imageTex.colorSpace = THREE.SRGBColorSpace
    imageTex.minFilter = THREE.LinearFilter
    imageTex.generateMipmaps = false
    /* eslint-enable react-hooks/immutability */
    const uniforms = createUniforms(controls)
    const s = new GridDistortion(size.width / size.height)
    return {
      u: uniforms,
      material: buildMaterial(uniforms, imageTex, s.texture),
      sim: s,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Distortion follows the pointer, so reduced motion softens it rather than
  // disabling the render (the image itself still shows).
  const motionScale = useMemo(
    () =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1,
    [],
  )

  useEffect(
    () => syncUniforms(u, controls, motionScale),
    [u, controls, motionScale],
  )

  // Mirror the <img>'s object-cover crop into UV space.
  useEffect(() => {
    const img = imageTex.image as { width: number; height: number }
    const imageAspect = img.width / img.height
    const containerAspect = size.width / size.height
    u.cover.value.set(
      Math.min(1, containerAspect / imageAspect),
      Math.min(1, imageAspect / containerAspect),
    )
  }, [u, imageTex, size])

  useEffect(
    () => () => {
      material.dispose()
      sim.dispose()
    },
    [material, sim],
  )

  useFrame((_, dt) => {
    sim.update(pointer.current, dt, {
      relaxation: controls.relaxation,
      radius: controls.radius,
      strength: controls.strength,
    })
  })

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

export default function DistortedImage({
  src,
  alt,
  className = '',
}: DistortedImageProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, vX: 0, vY: 0 })
  const [active, setActive] = useState(false)
  // Latches true on first intersection — the canvas (and its texture fetch)
  // isn't paid for until the image is actually approaching the viewport.
  const [mounted, setMounted] = useState(false)

  // Only run the frameloop while the image is on screen.
  useEffect(() => {
    const el = wrapper.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      setActive(entry.isIntersecting)
      if (entry.isIntersecting) setMounted(true)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const toLocal = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    }
  }

  const onPointerEnter = (e: React.PointerEvent) => {
    // Re-seat the pointer without a velocity spike on re-entry.
    const { x, y } = toLocal(e)
    pointer.current.x = x
    pointer.current.y = y
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = toLocal(e)
    const p = pointer.current
    p.vX = x - p.x
    p.vY = y - p.y
    p.x = x
    p.y = y
  }

  return (
    <div
      ref={wrapper}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      className='relative'
    >
      <img
        src={src}
        alt={alt}
        loading='lazy'
        className={`block w-full ${className}`}
      />
      {mounted && (
        <div className='absolute inset-0' aria-hidden='true'>
          <Canvas
            flat
            dpr={[1, 2]}
            frameloop={active ? 'always' : 'never'}
            gl={async (props) => {
              const renderer = new THREE.WebGPURenderer(
                props as ConstructorParameters<typeof THREE.WebGPURenderer>[0],
              )
              await renderer.init()
              return renderer
            }}
          >
            <Suspense fallback={null}>
              <DistortionPlane src={src} pointer={pointer} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  )
}
