import { useState } from 'react'
import Preloader from './components/Preloader'
import Hero from './sections/Hero'

function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <Hero revealed={revealed} />
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
