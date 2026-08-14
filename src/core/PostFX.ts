import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

/** Quiet Dread grade — single fullscreen pass, no bloom */
const QuietDreadShader = {
    uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uVignette: { value: 0.35 },
    uContrast: { value: 1.08 },
    uSaturation: { value: 0.85 },
    uCool: { value: 0.05 },
    uLift: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uCool;
    uniform float uLift;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = tex.rgb;
      c = (c - 0.5) * uContrast + 0.5;
      c = max(c - uLift, 0.0);
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, uSaturation);
      c.r -= uCool * 0.35;
      c.b += uCool * 0.55;
      c.g += uCool * 0.1;
      vec2 p = vUv * 2.0 - 1.0;
      float vig = 1.0 - dot(p, p) * uVignette;
      c *= clamp(vig, 0.55, 1.0);
      gl_FragColor = vec4(c, tex.a);
    }
  `,
}

export class PostFX {
  private readonly composer: EffectComposer
  private readonly grade: ShaderPass

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    this.grade = new ShaderPass(QuietDreadShader)
    this.composer.addPass(this.grade)
    this.composer.addPass(new OutputPass())
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h)
  }

  render(): void {
    this.composer.render()
  }

  setMood(mood: 'ORDER' | 'STRANGE' | 'PRESSURE' | 'BOSS' | 'FREEDOM'): void {
    const u = this.grade.uniforms
    switch (mood) {
      case 'ORDER':
        u.uVignette.value = 0.35
        u.uContrast.value = 1.08
        u.uSaturation.value = 0.85
        u.uCool.value = 0.05
        u.uLift.value = 0.0
        break
      case 'STRANGE':
        u.uVignette.value = 0.5
        u.uContrast.value = 1.15
        u.uSaturation.value = 0.7
        u.uCool.value = 0.1
        u.uLift.value = 0.0
        break
      case 'PRESSURE':
        u.uVignette.value = 0.6
        u.uContrast.value = 1.2
        u.uSaturation.value = 0.65
        u.uCool.value = 0.04
        u.uLift.value = 0.0
        break
      case 'BOSS':
        u.uVignette.value = 0.45
        u.uContrast.value = 1.12
        u.uSaturation.value = 0.7
        u.uCool.value = 0.12
        u.uLift.value = 0.0
        break
      case 'FREEDOM':
        u.uVignette.value = 0.2
        u.uContrast.value = 1.02
        u.uSaturation.value = 0.95
        u.uCool.value = -0.02
        u.uLift.value = 0.0
        break
    }
  }
}
