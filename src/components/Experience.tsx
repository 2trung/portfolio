import * as THREE from 'three/webgpu'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import DitherBackground from './DitherBackground'

export default function Experience() {
  return (
    <>
      <div style={{ position: 'relative', zIndex: 999 }}>
        <Leva collapsed hidden />
      </div>
      <div className='fixed inset-0 -z-10 bg-[#0e0d0c]'>
        <Canvas
          flat
          dpr={[1, 2]}
          gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(
              props as ConstructorParameters<typeof THREE.WebGPURenderer>[0],
            )
            await renderer.init()
            return renderer
          }}
        >
          <DitherBackground />
        </Canvas>
      </div>
    </>
  )
}
