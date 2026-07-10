import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three/webgpu'
import {
  float,
  instancedBufferAttribute,
  mix,
  mod,
  positionView,
  shapeCircle,
  texture,
  time,
  uniform,
  uv,
  vec3,
} from 'three/tsl'
import { useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { curlNoise } from './curlNoise'

gsap.registerPlugin(ScrollTrigger)

// `instancedBufferAttribute` and `shapeCircle` are typed as bare `Node`s
// without the fluent math surface — narrow them to concrete proxy nodes so we
// can chain operators (see CLAUDE.md "TSL type narrowing").
// `vec3()`/`float()` return narrow builder nodes; peel one operator off to get
// the general proxied `Node<"vec3">` / `Node<"float">` with the full math API.
type Vec3Node = ReturnType<ReturnType<typeof vec3>['add']>
type FloatNode = ReturnType<ReturnType<typeof float>['add']>

// ---- Point-cloud generation constants (mirror the source portrait build) ----
const PARTICLE_COUNT = 40000
const SPREAD_X = 5
const SPREAD_Y = 5
const DEPTH_SCALE = 3.5
const DENSITY_THRESHOLD = 0.85
const Z_DEPTH_THRESHOLD = 0.3
const P_SCALE_MIN = 0.8
const P_SCALE_MAX = 1.5
const BRIGHTNESS = 2

interface FaceControls {
  noiseFrequency: number
  noiseAmplitude: number
  pointSize: number
  focusDistance: number
}

/** The stable set of uniform nodes that drive the material. */
function createUniforms(c: FaceControls) {
  return {
    noiseFrequency: uniform(c.noiseFrequency),
    noiseAmplitude: uniform(c.noiseAmplitude),
    pointSize: uniform(c.pointSize),
    focusDistance: uniform(c.focusDistance),
    // Scroll-driven, not Leva-tuned — fades the whole cloud over About.
    opacity: uniform(1),
    // Scroll-driven: 1 = every particle sits on its star-sky shell position,
    // 0 = assembled portrait. Starts scattered; About's scroll gathers it.
    scatter: uniform(1),
    // Rides with scatter — stars are pure white, the portrait keeps its
    // sampled grayscale contrast.
    whiteMix: uniform(1),
  }
}

type Uniforms = ReturnType<typeof createUniforms>

/** Mirror the current Leva values onto the live uniform nodes. */
function syncUniforms(u: Uniforms, c: FaceControls): void {
  u.noiseFrequency.value = c.noiseFrequency
  u.noiseAmplitude.value = c.noiseAmplitude
  u.pointSize.value = c.pointSize
  u.focusDistance.value = c.focusDistance
}

interface SampledImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** Read an image's RGBA bytes off a 2D canvas for CPU-side sampling. */
function sampleImage(
  image: CanvasImageSource,
  width: number,
  height: number,
): SampledImage {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Failed to create 2D context')
  ctx.drawImage(image, 0, 0)
  return { data: ctx.getImageData(0, 0, width, height).data, width, height }
}

interface FaceBuild {
  sprite: THREE.Sprite
  uniforms: Uniforms
  dispose: () => void
}

/**
 * Load the color / depth maps, scatter particles across the visible surface of
 * the portrait, and compile the TSL graph. `color.webp` ships flattened to a
 * 16383×4 strip (lossless) — we rehydrate it back to the original 256×256 grid.
 */
async function buildFace(c: FaceControls): Promise<FaceBuild> {
  const loader = new THREE.TextureLoader()
  const [colorTex, depthTex, particleMap] = await Promise.all([
    loader.loadAsync('/images/face/color.webp'),
    loader.loadAsync('/images/face/depth.webp'),
    loader.loadAsync('/images/face/particle.jpg'),
  ])

  // Rehydrate the flattened color strip into a 256×256 RGBA grid.
  const strip = sampleImage(colorTex.image, 16384, 4)
  const col: SampledImage = { data: strip.data, width: 256, height: 256 }
  const depth = sampleImage(
    depthTex.image,
    depthTex.image.width,
    depthTex.image.height,
  )

  const pos = new Float32Array(PARTICLE_COUNT * 3)
  const starPos = new Float32Array(PARTICLE_COUNT * 3)
  const size = new Float32Array(PARTICLE_COUNT)
  const particleColor = new Float32Array(PARTICLE_COUNT * 3)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const px = Math.floor(Math.random() * col.width)
    const py = Math.floor(Math.random() * col.height)
    const pIndex = (py * col.width + px) * 4

    const r = col.data[pIndex] / 255
    const g = col.data[pIndex + 1] / 255
    const b = col.data[pIndex + 2] / 255
    const density = (r + g + b) / 3

    const depthSample = depth.data[pIndex] / 255
    const zDepth = 1 - depthSample

    const u = px / (col.width - 1)
    const v = py / (col.height - 1)

    const visible = zDepth > Z_DEPTH_THRESHOLD && density < DENSITY_THRESHOLD

    pos[i * 3] = (u - 0.5) * SPREAD_X + Math.random() * 0.1 - 0.05
    pos[i * 3 + 1] = (0.5 - v) * SPREAD_Y + Math.random() * 0.1 - 0.05
    pos[i * 3 + 2] =
      (zDepth * 2.0 - 1) * DEPTH_SCALE + Math.random() * 0.1 - 0.05

    // Star position: uniform-random point on a sphere shell around the
    // portrait, far enough out to read as a sky surrounding the camera.
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 25 + Math.random() * 25
    starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starPos[i * 3 + 2] = radius * Math.cos(phi)

    if (visible) {
      const contrast = (density * density * BRIGHTNESS + 0.01) ** 2
      particleColor[i * 3] = contrast
      particleColor[i * 3 + 1] = contrast
      particleColor[i * 3 + 2] = contrast
      size[i] = THREE.MathUtils.lerp(P_SCALE_MIN, P_SCALE_MAX, density)
    } else {
      size[i] = 0
    }
  }

  const uniforms = createUniforms(c)

  const posAttribute = new THREE.InstancedBufferAttribute(pos, 3)
  const starPosAttribute = new THREE.InstancedBufferAttribute(starPos, 3)
  const scaleAttribute = new THREE.InstancedBufferAttribute(size, 1)
  const colorAttribute = new THREE.InstancedBufferAttribute(particleColor, 3)

  const positionNode = instancedBufferAttribute(
    posAttribute,
  ) as unknown as Vec3Node
  const starPositionNode = instancedBufferAttribute(
    starPosAttribute,
  ) as unknown as Vec3Node

  // Star sky ↔ portrait blend, driven by scroll through the About track.
  const blendedPosition = mix(positionNode, starPositionNode, uniforms.scatter)

  // Slow-scrolling curl-noise wave over the surface. It only ripples the
  // assembled portrait — the noise amplitude fades to zero while scattered so
  // the star sky holds still.
  const t = mod(time, 120.0).mul(0.5).add(5.0)
  const noise = curlNoise(positionNode.mul(uniforms.noiseFrequency).add(t))
    .mul(uniforms.noiseAmplitude.mul(float(1).sub(uniforms.scatter)))
    .mul(0.1)
  const finalPosition = blendedPosition.add(noise)

  // Fake depth-of-field: particles fade the further they sit from the focus
  // plane, so no post-processing pass is needed. Stars bypass the DOF fade —
  // the whole sky renders at full alpha.
  const dynamicVDistance = uniforms.focusDistance.add(positionView.z).abs()
  const alpha = mix(
    float(1.1).sub(dynamicVDistance).max(0.05),
    float(1.0),
    uniforms.scatter,
  ).mul(uniforms.opacity)
  const pointSpriteUV = uv().flipY()

  // While scattered, every particle turns pure white — including the ones the
  // portrait leaves black — so the sky has the full 40k stars.
  const blendedColor = mix(
    instancedBufferAttribute(colorAttribute) as unknown as Vec3Node,
    vec3(1, 1, 1),
    uniforms.whiteMix,
  )

  const material = new THREE.PointsNodeMaterial({
    colorNode: texture(particleMap, pointSpriteUV).rgb.mul(blendedColor),
    opacityNode: (shapeCircle() as unknown as FloatNode).mul(alpha),
    positionNode: finalPosition,
    // Stars collapse to a fixed 1px point; the portrait recovers its
    // depth-scaled sizing as it gathers.
    sizeNode: mix(
      uniforms.pointSize
        .mul(dynamicVDistance.mul(1.5))
        .max(0.5)
        .min(6)
        .mul(instancedBufferAttribute(scaleAttribute)),
      float(1.0),
      uniforms.scatter,
    ),
    depthWrite: false,
    sizeAttenuation: false,
    transparent: true,
  })

  const sprite = new THREE.Sprite(material)
  sprite.count = PARTICLE_COUNT
  // The cloud spans a fixed bounding volume; skip per-frame frustum tests.
  sprite.frustumCulled = false
  // Hidden until the About section scrolls into view (see scroll effect).
  sprite.visible = false

  return {
    sprite,
    uniforms,
    dispose: () => {
      material.dispose()
      colorTex.dispose()
      depthTex.dispose()
      particleMap.dispose()
    },
  }
}

export default function FaceParticles() {
  const controls = useControls('Face', {
    noiseFrequency: { value: 2.5, min: 0, max: 20, step: 0.01 },
    noiseAmplitude: { value: 0.25, min: 0, max: 2, step: 0.001 },
    pointSize: { value: 4, min: 0, max: 10, step: 0.01 },
    focusDistance: { value: 10.08, min: 0, max: 20, step: 0.01 },
  }) as FaceControls

  const camera = useThree((s) => s.camera)
  const [face, setFace] = useState<FaceBuild | null>(null)

  // One-time async build; tear down GPU resources on unmount.
  useEffect(() => {
    let live = true
    let built: FaceBuild | null = null
    buildFace(controls).then((result) => {
      if (!live) {
        result.dispose()
        return
      }
      built = result
      setFace(result)
    })
    return () => {
      live = false
      built?.dispose()
    }
    // Built once — live values flow through syncUniforms below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Static 3/4 framing — the portrait always faces the origin.
  useEffect(() => {
    camera.lookAt(0, 0, 0)
  }, [camera])

  useEffect(() => {
    if (face) syncUniforms(face.uniforms, controls)
  }, [face, controls])

  // Scroll choreography over the About track (skip drawing outside it):
  //  1. the star sky fades in behind the opening mask-box expansion,
  //  2. the stars gather into the portrait — the old portfolio's scatter
  //     played in reverse — settling fully assembled at max scroll.
  useEffect(() => {
    if (!face) return
    const section = document.querySelector<HTMLElement>('#about')
    if (!section) return
    const { sprite, uniforms } = face

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          // About is the last section, so its bottom never reaches the
          // viewport top — end where the page's max scroll actually lands.
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            sprite.visible = self.isActive
          },
        },
      })
      tl.fromTo(
        uniforms.opacity,
        { value: 0 },
        { value: 1, duration: 1, ease: 'power2.out' },
      )
      tl.fromTo(
        uniforms.scatter,
        { value: 1 },
        { value: 0, duration: 2, ease: 'power2.out' },
      )
      tl.fromTo(
        uniforms.whiteMix,
        { value: 1 },
        { value: 0, duration: 2, ease: 'power2.out' },
        '<',
      )
    })

    return () => ctx.revert()
  }, [face])

  if (!face) return null
  return <primitive object={face.sprite} />
}
