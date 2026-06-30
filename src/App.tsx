import { useEffect, useState } from 'react'
import Preloader from './sections/Preloader'
import Experience from './components/Experience'
import Lenis from 'lenis'
import OpeningSequence from './sections/OpeningSequence'

function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Smooth scroll (Lenis) driving GSAP's ticker + ScrollTrigger.
  useEffect(() => {
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      window.removeEventListener('load', onLoad)
    }
  }, [])

  return (
    <>
      <OpeningSequence revealed={revealed} />
      <Experience />
      {!loaded && (
        <Preloader
          onReveal={() => setRevealed(true)}
          onComplete={() => setLoaded(true)}
        />
      )}
    </>
  )
}

export default App
