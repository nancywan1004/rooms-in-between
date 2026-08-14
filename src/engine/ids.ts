let seq = 0

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  seq += 1
  return `go_${Date.now().toString(36)}_${seq}`
}

export type Vec3Tuple = [number, number, number]

export function vec3Tuple(x: number, y: number, z: number): Vec3Tuple {
  return [x, y, z]
}

export function asVec3(v: unknown, fallback: Vec3Tuple = [0, 0, 0]): Vec3Tuple {
  if (Array.isArray(v) && v.length >= 3) {
    return [Number(v[0]) || 0, Number(v[1]) || 0, Number(v[2]) || 0]
  }
  return fallback
}

export function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export function asBool(v: unknown, fallback = true): boolean {
  return typeof v === 'boolean' ? v : fallback
}
