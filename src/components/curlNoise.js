// Simplex-based curl noise for TSL.
//
// three 0.185 does not ship a built-in `curlNoise`, so we port the transpiled
// (Three.js Transpiler r183) implementation. Only the chain curl noise needs is
// kept: mod289 → permute → taylorInvSqrt → snoise → sNoise3 → curlNoise.
//
// These functions are TSL node graphs, not plain math — the loose node typing
// is inherent to `three/tsl`, so params stay untyped by design.
import {
  Fn,
  overloadingFn,
  floor,
  mul,
  sub,
  vec2,
  vec3,
  vec4,
  dot,
  step,
  min,
  max,
  mod,
  float,
  abs,
  normalize,
  div,
} from 'three/tsl'

const mod289_0 = /*@__PURE__*/ Fn(
  ([x]) => x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0)),
  { x: 'vec3', return: 'vec3' },
)

const mod289_1 = /*@__PURE__*/ Fn(
  ([x]) => x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0)),
  { x: 'vec4', return: 'vec4' },
)

const mod289 = /*@__PURE__*/ overloadingFn([mod289_0, mod289_1])

const permute = /*@__PURE__*/ Fn(([x]) => mod289(x.mul(34.0).add(1.0).mul(x)), {
  x: 'vec4',
  return: 'vec4',
})

const taylorInvSqrt = /*@__PURE__*/ Fn(
  ([r]) => sub(1.79284291400159, mul(0.85373472095314, r)),
  { r: 'vec4', return: 'vec4' },
)

const snoise = /*@__PURE__*/ Fn(
  ([v]) => {
    const C = vec2(1.0 / 6.0, 1.0 / 3.0)
    const D = vec4(0.0, 0.5, 1.0, 2.0)
    const i = floor(v.add(dot(v, C.yyy)))
    const x0 = v.sub(i).add(dot(i, C.xxx))
    const g = step(x0.yzx, x0.xyz)
    const l = sub(1.0, g)
    const i1 = min(g.xyz, l.zxy)
    const i2 = max(g.xyz, l.zxy)
    const x1 = x0.sub(i1).add(C.xxx)
    const x2 = x0.sub(i2).add(mul(2.0, C.xxx))
    const x3 = x0.sub(1.0).add(mul(3.0, C.xxx))
    i.assign(mod(i, 289.0))
    const p = permute(
      permute(
        permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
          .add(i.y)
          .add(vec4(0.0, i1.y, i2.y, 1.0)),
      )
        .add(i.x)
        .add(vec4(0.0, i1.x, i2.x, 1.0)),
    )
    const n_ = float(1.0 / 7.0)
    const ns = n_.mul(D.wyz).sub(D.xzx)
    const j = p.sub(mul(49.0, floor(p.mul(ns.z).mul(ns.z))))
    const x_ = floor(j.mul(ns.z))
    const y_ = floor(j.sub(mul(7.0, x_)))
    const x = x_.mul(ns.x).add(ns.yyyy)
    const y = y_.mul(ns.x).add(ns.yyyy)
    const h = sub(1.0, abs(x)).sub(abs(y))
    const b0 = vec4(x.xy, y.xy)
    const b1 = vec4(x.zw, y.zw)
    const s0 = floor(b0).mul(2.0).add(1.0)
    const s1 = floor(b1).mul(2.0).add(1.0)
    const sh = step(h, vec4(0.0)).negate()
    const a0 = b0.xzyw.add(s0.xzyw.mul(sh.xxyy))
    const a1 = b1.xzyw.add(s1.xzyw.mul(sh.zzww))
    const p0 = vec3(a0.xy, h.x)
    const p1 = vec3(a0.zw, h.y)
    const p2 = vec3(a1.xy, h.z)
    const p3 = vec3(a1.zw, h.w)
    const norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)),
    )
    p0.mulAssign(norm.x)
    p1.mulAssign(norm.y)
    p2.mulAssign(norm.z)
    p3.mulAssign(norm.w)
    const m = max(
      sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
      0.0,
    )
    m.assign(m.mul(m))

    return mul(
      42.0,
      dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))),
    )
  },
  { v: 'vec3', return: 'float' },
)

const sNoise3 = /*@__PURE__*/ Fn(
  ([x]) => {
    const s = snoise(x)
    const s1 = snoise(vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2)))
    const s2 = snoise(vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4)))
    return vec3(s, s1, s2)
  },
  { x: 'vec3', return: 'vec3' },
)

export const curlNoise = /*@__PURE__*/ Fn(
  ([p]) => {
    const e = float(1.0)
    const dx = vec3(e, 0.0, 0.0)
    const dy = vec3(0.0, e, 0.0)
    const dz = vec3(0.0, 0.0, e)
    const p_x0 = sNoise3(p.sub(dx))
    const p_x1 = sNoise3(p.add(dx))
    const p_y0 = sNoise3(p.sub(dy))
    const p_y1 = sNoise3(p.add(dy))
    const p_z0 = sNoise3(p.sub(dz))
    const p_z1 = sNoise3(p.add(dz))
    const x = p_y1.z.sub(p_y0.z).sub(p_z1.y).add(p_z0.y)
    const y = p_z1.x.sub(p_z0.x).sub(p_x1.z).add(p_x0.z)
    const z = p_x1.y.sub(p_x0.y).sub(p_y1.x).add(p_y0.x)
    return normalize(vec3(x, y, z).mul(div(1.0, mul(2.0, e))))
  },
  { p: 'vec3', return: 'vec3' },
)
