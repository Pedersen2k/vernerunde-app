/** Skalerer ned og komprimerer et bilde slik at det tar lite plass på enheten. */
export async function compressImage(file: Blob, maxSize = 1600, quality = 0.8, type = 'image/jpeg', stamp?: string): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    if (stamp) drawStamp(ctx, width, height, stamp)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    return blob ?? file
  } catch {
    return file
  }
}

/** Legger tid og sted nederst på bildet, slik at bildet kan brukes som dokumentasjon. */
function drawStamp(ctx: CanvasRenderingContext2D, width: number, height: number, text: string) {
  const size = Math.max(14, Math.round(width / 34))
  const pad = Math.round(size * 0.6)
  ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.textBaseline = 'middle'
  let label = text
  while (ctx.measureText(label).width > width - pad * 2 && label.length > 4) label = label.slice(0, -2)
  if (label !== text) label = label.trimEnd() + '…'
  const barH = size + pad * 1.4
  ctx.fillStyle = 'rgba(2, 6, 23, 0.62)'
  ctx.fillRect(0, height - barH, width, barH)
  ctx.fillStyle = '#fff'
  ctx.fillText(label, pad, height - barH / 2)
}

export function stampText(zone: string, at = Date.now()) {
  const d = new Date(at)
  const date = d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time} · ${zone}`
}
