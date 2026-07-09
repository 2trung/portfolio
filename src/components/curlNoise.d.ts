import { vec3 } from 'three/tsl'

type Vec3Node = ReturnType<ReturnType<typeof vec3>['add']>

export declare const curlNoise: (p: Vec3Node) => Vec3Node
