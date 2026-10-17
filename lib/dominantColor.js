// Samples a cover image client-side and returns the cover's actual dominant
// color, suitable as a book-spine background. A flat average of every pixel
// tends to wash out to muddy gray/brown, so instead we bucket pixels (after
// dropping near-white/near-black/low-saturation ones — usually page edges,
// text, or background) and pick the most common bucket.
const cache = new Map()

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s, l]
}

function hslToHex(h, s, l) {
  h /= 360
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Perceived brightness — used to decide whether a spine needs light or dark text.
export function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

export function getDominantColor(url) {
  if (!url) return Promise.resolve(null)
  if (cache.has(url)) return cache.get(url)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 32
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        // Bucket pixels by coarse RGB to find the most common color region.
        // `colorfulOnly` skips pixels unlikely to represent the cover's identity
        // color (near-white/black, washed-out grays) — good for vivid covers,
        // but on a dark/moody cover it can filter out almost everything,
        // leaving a one-pixel "winner" that's really just noise.
        function bucketDominant(colorfulOnly) {
          const buckets = new Map()
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            if (colorfulOnly) {
              const [, s, l] = rgbToHsl(r, g, b)
              if (l > 0.92 || l < 0.08 || s < 0.15) continue
            }
            const key = `${r >> 4},${g >> 4},${b >> 4}`
            const entry = buckets.get(key)
            if (entry) { entry.count++; entry.r += r; entry.g += g; entry.b += b }
            else buckets.set(key, { count: 1, r, g, b })
          }
          let best = null
          for (const entry of buckets.values()) {
            if (!best || entry.count > best.count) best = entry
          }
          return best
        }

        const totalPixels = data.length / 4
        const minConfidence = Math.max(4, totalPixels * 0.02)
        let best = bucketDominant(true)
        if (!best || best.count < minConfidence) best = bucketDominant(false)

        const r = best.r / best.count, g = best.g / best.count, b = best.b / best.count
        const [h, s, l] = rgbToHsl(r, g, b)
        // Keep the real hue/saturation (that's the point), just clamp lightness
        // into a band that reads well as a spine rather than near-black or near-white.
        resolve(hslToHex(h, Math.max(s, 0.35), Math.min(Math.max(l, 0.22), 0.6)))
      } catch {
        resolve(null) // canvas tainted or unreadable — caller falls back
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

  cache.set(url, promise)
  return promise
}
