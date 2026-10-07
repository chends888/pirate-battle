export function facingVector(rotation: number): { x: number; y: number } {
  return {
    x: Math.sin(rotation),
    y: -Math.cos(rotation),
  }
}

export function angleTo(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toX - fromX, -(toY - fromY))
}

export function shortestAngle(from: number, to: number): number {
  let delta = to - from
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return delta
}

export function rotateToward(
  current: number,
  target: number,
  maxDelta: number,
): number {
  const delta = shortestAngle(current, target)
  if (delta > maxDelta) return current + maxDelta
  if (delta < -maxDelta) return current - maxDelta
  return current + delta
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
