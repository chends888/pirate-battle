export function circleHits(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx
  const dy = ay - by
  const r = ar + br
  return dx * dx + dy * dy < r * r
}

export function pushCircleOutOfCircle(
  x: number,
  y: number,
  radius: number,
  cx: number,
  cy: number,
  cr: number,
): { x: number; y: number } {
  const dx = x - cx
  const dy = y - cy
  const minDist = radius + cr
  const dist = Math.hypot(dx, dy)

  if (dist >= minDist && dist > 0) {
    return { x, y }
  }

  if (dist === 0) {
    return { x: cx + minDist, y: cy }
  }

  const scale = minDist / dist
  return { x: cx + dx * scale, y: cy + dy * scale }
}

export function clampToArena(
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.min(width - radius, Math.max(radius, x)),
    y: Math.min(height - radius, Math.max(radius, y)),
  }
}
