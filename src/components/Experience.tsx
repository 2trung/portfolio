import * as THREE from 'three/webgpu'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import DitherBackground from './DitherBackground'
import { useCanvasActive } from './useCanvasActive'
// import FaceParticles from './FaceParticles' // temporarily swapped for TechStack

export default function Experience() {
  // Render only while a canvas-revealing section is on screen (see hook).
  const active = useCanvasActive()

  return (
    <>
      <div style={{ position: 'relative', zIndex: 999 }}>
        <Leva collapsed hidden />
      </div>
      <div className='fixed inset-0 -z-10 bg-[#0e0d0c]'>
        <Canvas
          flat
          frameloop={active ? 'always' : 'never'}
          dpr={[1, 2]}
          camera={{ fov: 25, near: 0.1, far: 100, position: [3, 2, 13] }}
          gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(
              props as ConstructorParameters<typeof THREE.WebGPURenderer>[0],
            )
            await renderer.init()
            return renderer
          }}
        >
          <DitherBackground />
          {/* <FaceParticles /> temporarily swapped for TechStack */}
        </Canvas>
      </div>
    </>
  )
}
