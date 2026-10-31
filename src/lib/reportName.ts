import type { Round } from '../types'

export function reportFileName(round: Round) {
  const d = new Date(round.startedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const safe = (round.templateName || 'Vernerunde').replace(/[^\p{L}\p{N}]+/gu, '_')
  return `Vernerunde_${safe}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.pdf`
}
