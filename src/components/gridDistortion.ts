import * as THREE from 'three/webgpu'

const BASE = 15
const MAX = 128

export interface GridDistortionParams {
  /** Per-frame decay of the offset field at 60fps (0‒1, higher = slower). */
  relaxation: number
  /** Pointer influence radius as a fraction of the base grid size. */
  radius: number
  /** How hard pointer velocity is splatted into the field. */
  strength: number
}

export interface PointerState {
  x: number
  y: number
  vX: number
  vY: number
}

export class GridDistortion {
  readonly texture: THREE.DataTexture

  private readonly gridX: number
  private readonly gridY: number
  private readonly field: Float32Array
  private readonly bytes: Uint8Array

  /** Aspect keeps the cells square-ish; the grid never resizes after this. */
  constructor(aspect: number) {
    if (!Number.isFinite(aspect) || aspect <= 0) aspect = 1
    this.gridX = aspect >= 1 ? Math.min(MAX, Math.round(BASE * aspect)) : BASE
    this.gridY = aspect >= 1 ? BASE : Math.min(MAX, Math.round(BASE / aspect))
    this.field = new Float32Array(this.gridX * this.gridY * 2)
    this.bytes = new Uint8Array(this.gridX * this.gridY * 2).fill(128)

    this.texture = new THREE.DataTexture(
      this.bytes,
      this.gridX,
      this.gridY,
      THREE.RGFormat,
      THREE.UnsignedByteType,
    )
    this.texture.magFilter = THREE.NearestFilter
    this.texture.minFilter = THREE.NearestFilter
    this.texture.colorSpace = THREE.NoColorSpace
    this.texture.needsUpdate = true
  }

  /** Advance one frame. Pointer is bottom-left UV (0‒1); dt in seconds. */
  update(pointer: PointerState, dt: number, p: GridDistortionParams): void {
    dt = Math.min(dt, 0.016)
    const { field, bytes, gridX, gridY } = this

    // Frame-rate independent relaxation (p.relaxation is calibrated at 60fps).
    const relax = Math.pow(p.relaxation, dt * 60)
    for (let k = 0; k < field.length; k++) field[k] *= relax

    // Splat pointer velocity into cells inside the radius, weighted by 1/dist.
    const gx = gridX * pointer.x
    const gy = gridY * pointer.y
    const maxDist = BASE * p.radius
    const maxDistSq = maxDist * maxDist
    for (let i = 0; i < gridX; i++) {
      for (let j = 0; j < gridY; j++) {
        const distSq = (gx - i) ** 2 + (gy - j) ** 2
        if (distSq >= maxDistSq) continue
        const idx = 2 * (i + gridX * j)
        const power = Math.min(10, maxDist / Math.sqrt(distSq))
        field[idx] += p.strength * 100 * pointer.vX * power
        field[idx + 1] += p.strength * 100 * pointer.vY * power
      }
    }
    pointer.vX *= 0.9
    pointer.vY *= 0.9

    for (let k = 0; k < field.length; k++) {
      const v = Math.max(-1, Math.min(1, field[k]))
      bytes[k] = Math.round(v * 127 + 128)
    }
    this.texture.needsUpdate = true
  }

  dispose(): void {
    this.texture.dispose()
  }
}
