import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'

/** Lar brukeren tegne røde markeringer på et bilde, f.eks. rundt en skade. */
export function PhotoAnnotator({ blob, onSave, onCancel }: { blob: Blob; onSave: (b: Blob) => void; onCancel: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const base = useRef<ImageBitmap | null>(null)
  const strokes = useRef<{ x: number; y: number }[][]>([])
  const [count, setCount] = useState(0)

  const redraw = () => {
    const c = canvas.current
    const img = base.current
    if (!c || !img) return
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, c.width, c.height)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = Math.max(4, c.width / 140)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokes.current) {
      ctx.beginPath()
      s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.stroke()
    }
  }

  useEffect(() => {
    let alive = true
    createImageBitmap(blob).then((img) => {
      if (!alive || !canvas.current) return
      base.current = img
      canvas.current.width = img.width
      canvas.current.height = img.height
      redraw()
    })
    return () => {
      alive = false
    }
  }, [blob])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }

  return (
    <div className="fixed inset-0 z-[56] flex flex-col items-center justify-center gap-3 bg-black/95 p-4">
      <p className="text-sm font-semibold text-white">Tegn med fingeren for å markere funnet</p>
      <canvas
        ref={canvas}
        className="max-h-[70dvh] max-w-full touch-none rounded-xl"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          strokes.current.push([pos(e)])
          redraw()
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0 || strokes.current.length === 0) return
          strokes.current[strokes.current.length - 1].push(pos(e))
          redraw()
        }}
        onPointerUp={() => setCount(strokes.current.length)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={count === 0}
          onClick={() => {
            strokes.current.pop()
            setCount(strokes.current.length)
            redraw()
          }}
        >
          <ArrowCounterClockwise size={18} /> Angre
        </Button>
        <Button size="sm" onClick={onCancel}>
          Avbryt
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => canvas.current?.toBlob((b) => b && onSave(b), 'image/jpeg', 0.85)}
        >
          Lagre markering
        </Button>
      </div>
    </div>
  )
}
