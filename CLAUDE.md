# Portfolio — CLAUDE.md

Awwwards-level creative portfolio. Goal: visually exceptional, silky on high-end hardware, still fully functional on low-end devices.

## Commands

```bash
pnpm dev        # dev server
pnpm build      # tsc -b && vite build
pnpm preview    # preview prod bundle
pnpm lint       # eslint
```

## Stack

| Layer | Library | Version |
|---|---|---|
| Bundler | Vite | ^8 |
| UI | React 19 + TypeScript ~6 | strict |
| 3D renderer | Three.js WebGPU (`three/webgpu`) | ^0.185 |
| Shader graph | TSL (`three/tsl`) | bundled with Three |
| R3F | @react-three/fiber | ^9 |
| Dev controls | Leva | ^0.10 |
| Animation | GSAP + ScrollTrigger | ^3.15 |
| Smooth scroll | Lenis | ^1.3 |
| CSS | Tailwind v4 (`@tailwindcss/vite`) | ^4.3 |

## Folder structure

```
src/
  assets/fonts/          # woff2 only — Sohne (body) + Aeonik (display)
  components/            # reusable, render-context-aware pieces
    DitherBackground.tsx # WebGPU/TSL shader + liquid-flow overlay
    Experience.tsx       # R3F <Canvas> + Leva panel
    liquidFlow.ts        # CPU fluid sim (plain class, no React)
  sections/              # full-page scroll sections
    Hero.tsx             # hero layout + GSAP reveal
    OpeningSequence.tsx  # scroll-driven shutter/mask
    Preloader.tsx        # loading bar → slash → fade
  App.tsx                # root: Lenis + GSAP ticker wiring, state
  index.css              # Tailwind imports, @font-face, @theme tokens
  main.tsx               # ReactDOM entry
```

## Design tokens

Defined in `src/index.css` under `@theme`. Always use Tailwind utilities — never hardcode hex values in components.

```
cream   #f5f2ed   primary light surface, inverted text
gray    #888888   secondary text, dividers
ink     #211f1f   primary text (near-black)
black   #000000   pure black
red     #ee3335   primary accent
blue    #2d62ff   links / secondary accent
overlay #211f1f1a ink @ 10% — scrims, hairlines
```

Typography:
- `font-sans` → Sohne — body, UI labels, nav
- `font-display` → Aeonik — headings, large display text

## Three.js / TSL rules

**Always import from `three/webgpu`, never bare `three`.**
```ts
import * as THREE from 'three/webgpu'
```

**TSL imports from `three/tsl`.**
```ts
import { Fn, uniform, vec2, texture, time } from 'three/tsl'
```

**Shader authoring pattern** — three discrete functions, always:
1. `createUniforms(config)` — allocates uniform nodes once
2. `buildMaterial(uniforms, ...)` — compiles the TSL graph, returns a material
3. `syncUniforms(uniforms, config)` — mirrors live config values to nodes each frame; never re-allocates

```ts
// Good
const { u, material } = useMemo(() => {
  const uniforms = createUniforms(controls)
  return { u: uniforms, material: buildMaterial(uniforms, tex) }
}, [])
useEffect(() => syncUniforms(u, controls), [u, controls])

// Bad — re-building the material on every controls change
const material = useMemo(() => buildMaterial(controls), [controls])
```

**GPU resource lifecycle**
- Create geometries and materials in `useMemo([], [])` (empty deps = once per mount).
- Dispose in `useEffect(() => () => resource.dispose(), [resource])`.
- Never allocate inside `useFrame`.

**WebGPU renderer setup** — always async-init:
```ts
gl={async (props) => {
  const renderer = new THREE.WebGPURenderer(props)
  await renderer.init()
  return renderer
}}
```

**TSL type narrowing** — when `uniformArray(...).element()` resolves too loosely, cast and document:
```ts
type FloatNode = ReturnType<typeof float>
const on = states.element(idx) as unknown as FloatNode
```

## GSAP rules

**Always use `gsap.context`** scoped to a root ref. Return `ctx.revert()` for cleanup.
```ts
useLayoutEffect(() => {
  const ctx = gsap.context(() => { /* timelines here */ }, root)
  return () => ctx.revert()
}, [dep])
```

**Class selectors for animation targets** — prefix with the section name (`.hero-char`, `.hero-line`, `.preloader-bar`). This lets `gsap.context` scope them without ref-drilling.

**ScrollTrigger**
- Register in every file that uses it: `gsap.registerPlugin(ScrollTrigger)`.
- Always include `invalidateOnRefresh: true` on scroll triggers.
- Call `ScrollTrigger.refresh()` after `window load`.

**`will-change-transform`** — add only to elements being GSAP-animated, remove it via Tailwind after the animation completes if the element becomes static.

**Prefers-reduced-motion** — check at the top of every `useLayoutEffect` that drives an intro animation:
```ts
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```
Shorten duration values, not skip the animation entirely (layout still needs to run).

## Lenis + GSAP ticker

Set up once in `App.tsx`. Do not replicate:
```ts
const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
const raf = (time: number) => lenis.raf(time * 1000)
gsap.ticker.add(raf)
gsap.ticker.lagSmoothing(0)
```

## Leva

Used **only for development tuning**. Always render `<Leva collapsed hidden />` in production (pass `hidden` to the component — the `hidden` prop hides the panel entirely when true).

Keep every shader parameter in `useControls` with min/max/step during development. Lock values to production defaults before shipping a section.

## CSS / Tailwind conventions

**Responsive sizing** — prefer `clamp()` for font sizes and spacing over breakpoint utilities:
```tsx
style={{ fontSize: 'clamp(2.75rem, 11.5vw, 14rem)' }}
```

**Viewport spacing** — `px-[5vw] pb-[5vh]` style for section padding keeps proportions across screen sizes.

**Inline `style` only for dynamic values** — layout, colors, and static sizing go in Tailwind class strings.

**Overflow clipping for character animations** — wrap each animated character span in an `overflow-hidden` parent with bottom padding + negative margin to avoid clipping descenders:
```tsx
<span className='inline-block overflow-hidden pb-[0.12em] mb-[-0.12em] align-bottom'>
  <span className='hero-char inline-block will-change-transform'>{char}</span>
</span>
```

## Performance — low-end device rules

These are non-negotiable. Every new feature must comply.

| Concern | Rule |
|---|---|
| Canvas DPR | `dpr={[1, 2]}` — never higher than 2 |
| CPU sim grids | 128×128 max. No runtime resize |
| Frame delta cap | `dt = Math.min(dt, 0.016)` in all sims |
| Geometry allocation | Once in `useMemo`, never in `useFrame` |
| Textures | 8-bit `Uint8Array` + `RGFormat` DataTexture for CPU-written fields (universally filterable) |
| Draw calls | One fullscreen quad for background effects — no post-processing passes |
| Memory | Dispose all GPU resources on unmount |
| Scroll | Lenis + GSAP ticker only — no `requestAnimationFrame` loops outside of R3F |
| Reduced motion | Shorter durations, not skipped layouts |

## TypeScript conventions

- All component props are explicit named interfaces above the component.
- `useRef<HTMLElement>(null)` — always type the ref element.
- No `any`. Narrow TSL loose types with a local `type` alias and a documented cast.
- File naming: PascalCase `.tsx` for React components, camelCase `.ts` for classes and utilities.

## What to avoid

- Importing from bare `'three'` — breaks WebGPU tree-shaking.
- Re-building materials when only uniform values change — use `syncUniforms`.
- Mounting/unmounting R3F children to pause rendering — use `frameloop="demand"` or skip updates in `useFrame`.
- Abstractions before 3 real instances of a pattern exist.
- `console.log` left in committed code.
- Hardcoded hex colors — use design tokens via Tailwind utilities.
- GSAP animations outside a `gsap.context` scope.
