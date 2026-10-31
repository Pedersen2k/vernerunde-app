/** Sirkulær fremdriftsindikator. */
export function Ring({ value, max, size = 48, stroke = 5, label }: { value: number; max: number; size?: number; stroke?: number; label?: string }) {
  const pct = max === 0 ? 0 : value / max
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const done = max > 0 && value === max
  return (
    <div className={`ring ${done ? 'ring-done' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-value"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{label ?? `${Math.round(pct * 100)}%`}</span>
    </div>
  )
}
