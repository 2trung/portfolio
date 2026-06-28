import * as THREE from 'three/webgpu'

// CPU-side "liquid flow" sim (ported from the shaders.com ChromaFlow preset).
// A 128×128 grid holds two fields:
//   • displacement — a velocity field, splatted by pointer motion, decaying
//   • liquid       — dye density, advected along the displacement, decaying
// Only the liquid field is uploaded (as an 8-bit RG DataTexture — universally
// filterable, unlike 32-bit float) and sampled by the dither material.

const GRID = 128

export interface LiquidFlowParams {
  intensity: number
  radius: number
  momentum: number
}

export class LiquidFlow {
  readonly liquidTexture: THREE.DataTexture

  private readonly disp = new Float32Array(GRID * GRID * 2)
  private readonly liquid = new Float32Array(GRID * GRID * 2)
  private readonly tDisp = new Float32Array(GRID * GRID * 2)
  private readonly tLiquid = new Float32Array(GRID * GRID * 2)
  private readonly bytes = new Uint8Array(GRID * GRID * 2)

  private mvx = 0
  private mvy = 0
  private prevX = 0.5
  private prevY = 0.5

  constructor() {
    this.liquidTexture = new THREE.DataTexture(
      this.bytes,
      GRID,
      GRID,
      THREE.RGFormat,
      THREE.UnsignedByteType,
    )
    this.liquidTexture.magFilter = THREE.LinearFilter
    this.liquidTexture.minFilter = THREE.LinearFilter
    this.liquidTexture.colorSpace = THREE.NoColorSpace
    this.liquidTexture.needsUpdate = true
  }

  /** Advance one frame. Pointer is bottom-left UV (0‒1); dt in seconds. */
  update(px: number, py: number, aspect: number, dt: number, p: LiquidFlowParams): void {
    const N = GRID
    dt = Math.min(dt, 0.016)

    const velX = dt > 0 ? (px - this.prevX) / dt : 0
    const velY = dt > 0 ? (py - this.prevY) / dt : 0
    this.mvx = this.mvx * 0.85 + velX * 0.15
    this.mvy = this.mvy * 0.85 + velY * 0.15

    const intensity = p.intensity
    const radius = p.radius * 0.05
    const momentum = p.momentum
    const { disp, liquid, tDisp, tLiquid } = this

    tDisp.set(disp)
    tLiquid.set(liquid)

    const flowFade = 1 - dt / Math.max(0.1, 1)
    for (let k = 0; k < N * N * 2; k++) tDisp[k] = disp[k] * flowFade

    // Advect the liquid along the displacement field (semi-Lagrangian).
    const liquidFade = 1 - dt / Math.max(0.4, 1)
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const idx = (i * N + j) * 2
        tLiquid[idx] = liquid[idx] * liquidFade
        tLiquid[idx + 1] = liquid[idx + 1] * liquidFade
        if (Math.abs(disp[idx]) > 0.001 || Math.abs(disp[idx + 1]) > 0.001) {
          const flowSpeed = momentum * 50 * dt
          const ax = j - disp[idx] * flowSpeed
          const ay = i - disp[idx + 1] * flowSpeed
          const x0 = Math.floor(ax)
          const y0 = Math.floor(ay)
          const x1 = x0 + 1
          const y1 = y0 + 1
          if (x0 >= 0 && y0 >= 0 && x1 < N && y1 < N) {
            const fx = ax - x0
            const fy = ay - y0
            const i00 = (y0 * N + x0) * 2
            const i01 = (y0 * N + x1) * 2
            const i10 = (y1 * N + x0) * 2
            const i11 = (y1 * N + x1) * 2
            tLiquid[idx] =
              (liquid[i00] * (1 - fx) * (1 - fy) +
                liquid[i01] * fx * (1 - fy) +
                liquid[i10] * (1 - fx) * fy +
                liquid[i11] * fx * fy) *
              liquidFade
          }
        }
      }
    }

    // Inject velocity + dye near the pointer, gated by movement speed.
    const speed = Math.sqrt(this.mvx * this.mvx + this.mvy * this.mvy)
    const moving = Math.abs(velX) + Math.abs(velY) > 0.01
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const idx = (i * N + j) * 2
        const cellX = (j + 0.5) / N
        const cellY = (i + 0.5) / N
        const dx = aspect >= 1 ? (cellX - px) * aspect : cellX - px
        const dy = aspect >= 1 ? cellY - py : (cellY - py) / aspect
        const dist = Math.sqrt(dx * dx + dy * dy)
        const effR = radius * Math.min(speed * speed * 20, 1)
        if (effR > 0 && dist < effR * 2 && moving) {
          const influence = Math.exp((-dist * dist) / (effR * effR))
          const amt = influence * (intensity * 100) * dt * 0.01
          tDisp[idx] += this.mvx * amt
          tDisp[idx + 1] += this.mvy * amt
          tLiquid[idx] += amt * Math.min(speed * 10, 1)
        }
        tDisp[idx] = Math.max(-1, Math.min(1, tDisp[idx]))
        tDisp[idx + 1] = Math.max(-1, Math.min(1, tDisp[idx + 1]))
        tLiquid[idx] = Math.max(0, Math.min(1, tLiquid[idx]))
        tLiquid[idx + 1] = 0
      }
    }

    disp.set(tDisp)
    liquid.set(tLiquid)

    const bytes = this.bytes
    for (let k = 0; k < N * N * 2; k++) bytes[k] = (liquid[k] * 255) | 0
    this.liquidTexture.needsUpdate = true

    this.prevX = px
    this.prevY = py
  }

  dispose(): void {
    this.liquidTexture.dispose()
  }
}
