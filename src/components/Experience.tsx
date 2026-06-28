import * as THREE from 'three/webgpu'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import DitherBackground from './DitherBackground'

/**
 * The single WebGPU canvas for the whole site, sitting behind the page. Every
 * section's R3F scene lives in here so they share one renderer, one render loop,
 * and one GPU context; the Leva debug panel is set up once here too.
 */
export default function Experience() {
  return (
    <>
      <div style={{ position: 'relative', zIndex: 999 }}>
        <Leva collapsed />
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
