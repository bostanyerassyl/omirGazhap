export const ALMATY_BOUNDS = {
  latMin: 43.225,
  latMax: 43.255,
  lngMin: 76.93,
  lngMax: 76.97,
}

export function percentToLngLat(xPercent: number, yPercent: number): [number, number] {
  const x = Math.max(0, Math.min(100, xPercent))
  const y = Math.max(0, Math.min(100, yPercent))

  const lng = ALMATY_BOUNDS.lngMin + (x / 100) * (ALMATY_BOUNDS.lngMax - ALMATY_BOUNDS.lngMin)
  const lat = ALMATY_BOUNDS.latMax - (y / 100) * (ALMATY_BOUNDS.latMax - ALMATY_BOUNDS.latMin)

  return [lng, lat]
}
