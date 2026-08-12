import * as THREE from 'three'

const texCache = new Map<string, THREE.Texture>()

function cache(key: string, make: () => THREE.Texture): THREE.Texture {
  const hit = texCache.get(key)
  if (hit) return hit
  const t = make()
  t.colorSpace = THREE.SRGBColorSpace
  texCache.set(key, t)
  return t
}

/** Industrial office carpet — muted mottled gray-brown */
export function carpetTexture(): THREE.Texture {
  return cache('carpet', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#7a746c'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 9000; i++) {
      const g = 90 + ((i * 17) % 50)
      const r = g + ((i * 3) % 12)
      const b = g - ((i * 5) % 10)
      ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + (i % 5) * 0.02})`
      ctx.fillRect((i * 37) % size, (i * 53) % size, 1 + (i % 2), 1 + (i % 3))
    }
    // Soft weave lines
    ctx.strokeStyle = 'rgba(60,55,50,0.06)'
    for (let y = 0; y < size; y += 4) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.anisotropy = 8
    return tex
  })
}

/** Acoustic ceiling tile with faint grid */
export function ceilingTileTexture(): THREE.Texture {
  return cache('ceiling', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#d8d4cc'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 4000; i++) {
      const v = 200 + (i % 30)
      ctx.fillStyle = `rgba(${v},${v - 2},${v - 6},0.15)`
      ctx.fillRect((i * 41) % size, (i * 29) % size, 2, 2)
    }
    ctx.strokeStyle = 'rgba(140,136,128,0.35)'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, size - 4, size - 4)
    ctx.strokeStyle = 'rgba(160,156,148,0.2)'
    ctx.strokeRect(size / 2, 2, 0.5, size - 4)
    ctx.strokeRect(2, size / 2, size - 4, 0.5)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

/** Soft wall paint with subtle vertical variation */
export function wallPaintTexture(): THREE.Texture {
  return cache('wall', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, size, 0)
    grad.addColorStop(0, '#cec9c0')
    grad.addColorStop(0.5, '#d4cfc6')
    grad.addColorStop(1, '#cac5bc')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(180,175,168,${0.03 + (i % 4) * 0.01})`
      ctx.fillRect((i * 19) % size, (i * 47) % size, 3, 8)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

export type SloganStyle = 'black' | 'muted'

/** Corporate wall slogan — bold condensed sans */
export function sloganTexture(
  lines: string[],
  opts: { width?: number; height?: number; style?: SloganStyle } = {},
): THREE.CanvasTexture {
  const width = opts.width ?? 1024
  const height = opts.height ?? 512
  const key = `slogan:${lines.join('|')}:${width}x${height}:${opts.style ?? 'black'}`
  return cache(key, () => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = opts.style === 'muted' ? 'rgba(60,58,56,0.55)' : 'rgba(28,26,26,0.92)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.floor(height / (lines.length * 1.6))}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`

    const lineH = height / (lines.length + 1)
    lines.forEach((line, i) => {
      ctx.fillText(line.toUpperCase(), width / 2, lineH * (i + 1), width * 0.92)
    })

    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }) as THREE.CanvasTexture
}

/** CRT green phosphor glow pattern */
export function crtScreenTexture(): THREE.Texture {
  return cache('crt', () => {
    const size = 128
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0a1810'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(40,180,90,0.35)'
    ctx.font = '10px monospace'
    for (let y = 12; y < size; y += 11) {
      ctx.fillText('████ ░░ ████ ░░░░', 6, y)
    }
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, y, size, 1)
    }
    return new THREE.CanvasTexture(c)
  })
}

/** Compliance board poster */
export function noticeBoardTexture(): THREE.Texture {
  return cache('notice', () => {
    const w = 512
    const h = 384
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#efeae2'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c4887a'
    ctx.fillRect(0, 0, w, 28)
    ctx.fillStyle = '#2c2a2a'
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('COMPLIANCE NOTICE', w / 2, 70)
    ctx.font = '16px Arial, sans-serif'
    ctx.fillStyle = '#4a4844'
    const lines = [
      'Outstanding tasks must be resolved',
      'before elevator access is restored.',
      '',
      'Remember: WORK. OBEY. COMPLY.',
      '',
      '— Management',
    ]
    lines.forEach((l, i) => ctx.fillText(l, w / 2, 120 + i * 28))
    return new THREE.CanvasTexture(c)
  })
}
