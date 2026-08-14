import * as THREE from 'three'

const texCache = new Map<string, THREE.Texture>()

function cache(key: string, make: () => THREE.Texture): THREE.Texture {
  const hit = texCache.get(key)
  if (hit) return hit
  const t = make()
  // Allow makers to opt into NoColorSpace (roughness/data maps)
  if ((t as THREE.Texture & { __dataMap?: boolean }).__dataMap) {
    t.colorSpace = THREE.NoColorSpace
  } else {
    t.colorSpace = THREE.SRGBColorSpace
  }
  texCache.set(key, t)
  return t
}

/** Industrial office carpet — denser mottled gray-brown with wear */
export function carpetTexture(): THREE.Texture {
  return cache('carpet_v2', () => {
    const size = 512
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#6a645c'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 28000; i++) {
      const g = 70 + ((i * 17) % 55)
      const r = g + ((i * 3) % 14) - 4
      const b = g - ((i * 5) % 12)
      ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + (i % 6) * 0.025})`
      ctx.fillRect((i * 37) % size, (i * 53) % size, 1 + (i % 3), 1 + (i % 4))
    }
    // Traffic wear streaks
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(90,85,78,${0.08 + (i % 5) * 0.02})`
      ctx.lineWidth = 2 + (i % 3)
      ctx.beginPath()
      ctx.moveTo((i * 47) % size, 0)
      ctx.lineTo(((i * 47) + 80) % size, size)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(45,42,38,0.08)'
    for (let y = 0; y < size; y += 3) {
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

/** Desk laminate — warm gray with fine grain + faint edge wear */
export function deskLaminateTexture(): THREE.Texture {
  return cache('desk_lam', () => {
    const size = 512
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#b8ae9c')
    grad.addColorStop(0.5, '#c4baa8')
    grad.addColorStop(1, '#aea492')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 12000; i++) {
      const v = 160 + (i % 40)
      ctx.fillStyle = `rgba(${v},${v - 8},${v - 20},0.06)`
      ctx.fillRect((i * 19) % size, (i * 31) % size, 2 + (i % 4), 1)
    }
    // Coffee ring stains (subtle)
    for (const [cx, cy] of [
      [120, 200],
      [380, 340],
      [260, 90],
    ]) {
      ctx.strokeStyle = 'rgba(90,70,50,0.12)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, 18 + (cx % 10), 0, Math.PI * 2)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.anisotropy = 4
    return tex
  })
}

/** Beige office plastic — micro noise for CRT / printer housings */
export function beigePlasticTexture(): THREE.Texture {
  return cache('plastic', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#c8c0b0'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 8000; i++) {
      const v = 180 + (i % 35)
      ctx.fillStyle = `rgba(${v},${v - 4},${v - 14},0.12)`
      ctx.fillRect((i * 23) % size, (i * 41) % size, 1, 1)
    }
    // Soft molded highlight band
    const g = ctx.createLinearGradient(0, 0, 0, size)
    g.addColorStop(0, 'rgba(255,255,250,0.12)')
    g.addColorStop(0.4, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(40,35,30,0.1)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

/** Brushed metal for cabinets / frames */
export function brushedMetalTexture(): THREE.Texture {
  return cache('metal', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#6a7684'
    ctx.fillRect(0, 0, size, size)
    for (let y = 0; y < size; y++) {
      const v = 90 + ((y * 17) % 40)
      ctx.fillStyle = `rgba(${v},${v + 4},${v + 10},${0.15 + (y % 3) * 0.05})`
      ctx.fillRect(0, y, size, 1)
    }
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(200,210,220,${0.04 + (i % 4) * 0.02})`
      ctx.beginPath()
      ctx.moveTo(0, (i * 37) % size)
      ctx.lineTo(size, ((i * 37) + 8) % size)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

/** Roughness companion for laminate (scuffs) */
export function deskRoughnessTexture(): THREE.Texture {
  return cache('desk_rough', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#b0b0b0'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 4000; i++) {
      const v = 100 + (i % 80)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect((i * 29) % size, (i * 47) % size, 2, 2)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    ;(tex as THREE.Texture & { __dataMap?: boolean }).__dataMap = true
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

/** Vending machine "REFRESH" label */
export function vendingLabelTexture(): THREE.Texture {
  return cache('vending', () => {
    const w = 512
    const h = 128
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#2c2a2a'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c4887a'
    ctx.fillRect(0, 0, w, 8)
    ctx.fillRect(0, h - 8, w, 8)
    ctx.fillStyle = '#efeae2'
    ctx.font = 'bold 56px "Arial Narrow", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('REFRESH', w / 2, h / 2)
    return new THREE.CanvasTexture(c)
  })
}

/** Abstract corporate wall art — muted geometric */
export function wallFrameTexture(): THREE.Texture {
  return cache('frame', () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#c8c0b4'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#8a9a86'
    ctx.fillRect(24, 40, 100, 160)
    ctx.fillStyle = '#6d7f92'
    ctx.fillRect(140, 60, 80, 120)
    ctx.fillStyle = '#b0a4b8'
    ctx.beginPath()
    ctx.arc(180, 180, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(44,42,42,0.15)'
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(c)
  })
}

