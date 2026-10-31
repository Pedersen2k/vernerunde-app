import { useEffect, useRef } from 'react'

/** Felt for signatur med finger eller mus. Kaller onChange med PNG-data-URL, eller null når feltet tømmes. */
export function SignaturePad({ label, value, onChange }: { label: string; value?: string; onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = rect.width * ratio
    c.height = rect.height * ratio
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = value
    }
    // Kun ved første visning; senere endringer kommer fra brukeren selv.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const clear = () => {
    const c = canvas.current
    if (!c) return
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    dirty.current = false
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <button type="button" onClick={clear} className="text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400">
          Tøm felt
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvas}
          className="h-32 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/60"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drawing.current = true
            const ctx = e.currentTarget.getContext('2d')!
            const p = point(e)
            ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a'
            ctx.lineWidth = 2.4
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = e.currentTarget.getContext('2d')!
            const p = point(e)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
            dirty.current = true
          }}
          onPointerUp={() => {
            drawing.current = false
            if (dirty.current && canvas.current) onChange(signaturePng(canvas.current))
          }}
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400">Tegn signatur her</span>
      </div>
    </div>
  )
}

/** Signaturen lagres alltid som mørk strek på gjennomsiktig bakgrunn, så den passer i rapporten. */
function signaturePng(c: HTMLCanvasElement) {
  const out = document.createElement('canvas')
  out.width = c.width
  out.height = c.height
  const ctx = out.getContext('2d')!
  ctx.drawImage(c, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, out.width, out.height)
  return out.toDataURL('image/png')
}
