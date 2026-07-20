import type Lenis from 'lenis'

// The single Lenis instance is created in App.tsx; it lives here so sections
// can trigger programmatic scrolls (e.g. back-to-top) without prop-drilling.
export let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
}
