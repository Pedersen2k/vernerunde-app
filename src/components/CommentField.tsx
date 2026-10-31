import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
}

/** Tekstfelt som lagrer automatisk kort tid etter at man slutter å skrive. */
export function CommentField({ value, onSave, placeholder, label, rows = 3 }: Props) {
  const [text, setText] = useState(value)
  const pending = useRef<{ timer: number; value: string } | null>(null)
  const saveRef = useRef(onSave)

  useEffect(() => {
    saveRef.current = onSave
  }, [onSave])

  const flush = () => {
    const p = pending.current
    if (!p) return
    window.clearTimeout(p.timer)
    pending.current = null
    saveRef.current(p.value)
  }

  // Lagre det som er skrevet hvis man forlater skjermen før lagringen har skjedd.
  useEffect(() => flush, [])

  const change = (v: string) => {
    setText(v)
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = { value: v, timer: window.setTimeout(flush, 500) }
  }

  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea value={text} rows={rows} placeholder={placeholder} onChange={(e) => change(e.target.value)} onBlur={flush} />
    </label>
  )
}
