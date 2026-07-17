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

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
