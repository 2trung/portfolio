import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Preloader from './sections/Preloader'
import Experience from './components/Experience'
import Lenis from 'lenis'
import OpeningSequence from './sections/OpeningSequence'
// import About from './sections/About'
import TechStack from './sections/TechStack'
import Manifesto from './sections/Manifesto'
import Footer from './sections/Footer'
import DevNotice from './components/DevNotice'
import { setLenis } from './lenis'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const lenis = new Lenis()
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      gsap.ticker.remove(raf)
      setLenis(null)
      lenis.destroy()
      window.removeEventListener('load', onLoad)
    }
  }, [])

  return (
    <>
      <OpeningSequence revealed={revealed} />
      <TechStack />
      <Manifesto />
      <Footer />
      <Experience />
      {loaded && <DevNotice />}
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
