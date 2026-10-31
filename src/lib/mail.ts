import type { OrgSettings } from '../types'
import { SEVERITY, type DeviationRef } from './deviations'
import { formatDate } from './format'

/** Utkast til e-post om et avvik: faktabasert, med frist og krav om tilbakemelding. */
export function deviationMail(d: DeviationRef, settings: OrgSettings) {
  const { item, area, round, deviation } = d
  const lines = [
    settings.managerName ? `Hei ${settings.managerName.split(' ')[0]},` : 'Hei,',
    '',
    `Ved vernerunde ${formatDate(round.startedAt)}${round.location ? ` (${round.location})` : ''} ble følgende avvik registrert:`,
    '',
    `Hva: ${item.text}`,
    `Hvor: ${area.name}`,
    item.comment ? `Beskrivelse: ${item.comment}` : '',
    `Alvorlighetsgrad: ${SEVERITY[deviation.severity].label}`,
    `Frist for tiltak: ${formatDate(deviation.due)}`,
    deviation.responsible ? `Ansvarlig: ${deviation.responsible}` : '',
    item.photoIds.length ? 'Bilder er dokumentert i vernerunderapporten.' : '',
    '',
    deviation.severity === 'kritisk' ? 'Avviket vurderes som kritisk og krever oppfølging med en gang.' : '',
    'Jeg ber om at tiltak iverksettes innen fristen, og om en skriftlig tilbakemelding på hva som gjøres. Avviket følges opp i det systematiske HMS-arbeidet (arbeidsmiljøloven § 3-1), og tas om nødvendig opp i AMU.',
    '',
    'Med vennlig hilsen',
    settings.inspectorName || '',
    'Verneombud' + (settings.department ? `, ${settings.department}` : ''),
  ]
  const body = lines.filter((l, i) => l !== '' || lines[i - 1] !== '').join('\n')
  const subject = `Avvik fra vernerunde: ${item.text} (frist ${formatDate(deviation.due)})`
  return { subject, body, href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` }
}
