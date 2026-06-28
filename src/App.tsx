import { useState } from 'react'
import Preloader from './sections/Preloader'
import Experience from './components/Experience'
import Hero from './sections/Hero'

function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <Hero revealed={revealed} />
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
