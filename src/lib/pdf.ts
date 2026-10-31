import { jsPDF } from 'jspdf'
import { db } from '../db'
import type { OrgSettings, Round, Signature, Status } from '../types'
import { collectDeviations, dueLabel, SEVERITY } from './deviations'
import { formatDate, formatDateTime } from './format'
import { roundStats } from './rounds'

type Img = { data: string; w: number; h: number; format: 'PNG' | 'JPEG' }

/** Gjør et bilde om til data-URL som jsPDF kan bruke, og skalerer ned store bilder. */
async function loadImage(blob: Blob, max = 1200, format: 'PNG' | 'JPEG' = 'JPEG'): Promise<Img | null> {
  try {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    const ctx = c.getContext('2d')!
    if (format === 'JPEG') {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
    }
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    return { data: c.toDataURL(format === 'PNG' ? 'image/png' : 'image/jpeg', 0.82), w: c.width, h: c.height, format }
  } catch {
    return null
  }
}

async function dataUrlImage(url: string): Promise<Img | null> {
  const blob = await (await fetch(url)).blob()
  return loadImage(blob, 800, 'PNG')
}

const STATUS_TEXT: Record<Status, string> = { ok: 'OK', merknad: 'Merknad', avvik: 'Avvik', na: 'Ikke relevant' }
const STATUS_COLOR: Record<Status | 'none', [number, number, number]> = {
  ok: [22, 163, 74],
  merknad: [202, 138, 4],
  avvik: [220, 38, 38],
  na: [100, 116, 139],
  none: [148, 163, 184],
}

export async function buildReportPdf(round: Round, settings: OrgSettings): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16
  const CW = W - 2 * M
  let y = M

  const text = (t: string, x: number, size = 10, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [15, 23, 42]) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.text(t, x, y)
  }
  const wrap = (t: string, width: number, size: number) => {
    doc.setFontSize(size)
    return doc.splitTextToSize(t, width) as string[]
  }
  const ensure = (h: number) => {
    if (y + h > 297 - 20) {
      doc.addPage()
      y = M
    }
  }
  const rule = (color: [number, number, number] = [226, 232, 240], width = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(width)
    doc.line(M, y, W - M, y)
  }

  // ---- Topp ----
  if (settings.logo) {
    const logo = await loadImage(settings.logo, 400, 'PNG')
    if (logo) {
      const h = 18
      const w = Math.min(45, (logo.w / logo.h) * h)
      doc.addImage(logo.data, logo.format, W - M - w, y - 2, w, (logo.h / logo.w) * w > h ? h : (logo.h / logo.w) * w)
    }
  }
  y += 3
  text((settings.companyName || 'Vernerunde').toUpperCase(), M, 8.5, 'bold', [100, 116, 139])
  y += 8
  text('Vernerunderapport', M, 20, 'bold')
  y += 7
  for (const line of wrap(round.title, CW - 50, 11)) {
    text(line, M, 11, 'normal', [71, 85, 105])
    y += 5
  }
  y += 3
  rule([15, 23, 42], 0.6)
  y += 7

  // ---- Fakta ----
  const facts: [string, string][] = [
    ['Dato', formatDate(round.startedAt)],
    ['Sted', round.location || '–'],
    ['Sjekkliste', round.templateName || '–'],
    ['Deltakere', round.participants || '–'],
    ['Status', round.finishedAt ? `Fullført ${formatDateTime(round.finishedAt)}` : 'Utkast (ikke fullført)'],
  ]
  for (const [k, v] of facts) {
    const lines = wrap(v, CW - 32, 10)
    text(k, M, 9, 'bold', [100, 116, 139])
    lines.forEach((l, i) => {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(l, M + 32, y + i * 4.6)
    })
    y += Math.max(1, lines.length) * 4.6 + 1.6
  }
  y += 3

  // ---- Nøkkeltall ----
  const s = roundStats(round.areas)
  const boxes: [string, string, [number, number, number]][] = [
    ['Godkjent', `${s.score}%`, [22, 163, 74]],
    ['OK', String(s.ok), STATUS_COLOR.ok],
    ['Merknader', String(s.merknad), STATUS_COLOR.merknad],
    ['Avvik', String(s.avvik), STATUS_COLOR.avvik],
    ['Ikke sjekket', String(s.total - s.checked), STATUS_COLOR.none],
  ]
  const bw = (CW - 4 * 3) / 5
  boxes.forEach(([label, value, color], i) => {
    const x = M + i * (bw + 3)
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(x, y, bw, 17, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(...color)
    doc.text(value, x + 4, y + 8.5)
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(label, x + 4, y + 13.5)
  })
  y += 25

  // ---- Funn ----
  const devIds = new Set(collectDeviations([round]).map((d) => d.item.id))
  const findings = round.areas.flatMap((a) => a.items.filter((i) => i.status === 'avvik' || i.status === 'merknad').map((i) => ({ a, i })))
  ensure(14)
  text('AVVIK OG MERKNADER', M, 9, 'bold', [71, 85, 105])
  y += 2.5
  rule()
  y += 6
  if (findings.length === 0) {
    text('Ingen avvik eller merknader registrert.', M, 10, 'normal', [100, 116, 139])
    y += 8
  }
  let fn = 0
  for (const { a, i } of findings) {
    fn++
    const color = STATUS_COLOR[i.status!]
    const titleLines = wrap(`${fn}. ${i.text}`, CW - 30, 10.5)
    ensure(titleLines.length * 5 + 14)
    doc.setFillColor(...color)
    doc.roundedRect(W - M - 24, y - 4, 24, 6, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(STATUS_TEXT[i.status!].toUpperCase(), W - M - 12, y, { align: 'center' })
    titleLines.forEach((l) => {
      text(l, M, 10.5, 'bold')
      y += 5
    })
    const meta = [a.name]
    if (i.status === 'avvik' && i.deviation && devIds.has(i.id)) {
      meta.push(`Alvorlighet: ${SEVERITY[i.deviation.severity].label}`)
      meta.push(i.deviation.resolvedAt ? `Utbedret ${formatDate(i.deviation.resolvedAt)}` : `Frist ${formatDate(i.deviation.due)} (${dueLabel(i.deviation).toLowerCase()})`)
      if (i.deviation.responsible) meta.push(`Ansvarlig: ${i.deviation.responsible}`)
    }
    for (const l of wrap(meta.join('  •  '), CW, 8.5)) {
      text(l, M, 8.5, 'normal', [100, 116, 139])
      y += 4.2
    }
    if (i.comment) {
      y += 1
      for (const l of wrap(i.comment, CW, 10)) {
        ensure(5)
        text(l, M, 10, 'normal', [30, 41, 59])
        y += 4.8
      }
    }
    // Bilder: ett stort bilde alene, ellers to i bredden
    const photos = (await db.photos.bulkGet(i.photoIds)).filter(Boolean)
    if (photos.length) {
      y += 2
      const cols = photos.length === 1 ? 1 : 2
      const pw = (CW - (cols - 1) * 4) / cols
      const maxH = cols === 1 ? 105 : 80
      let col = 0
      let rowH = 0
      for (const p of photos) {
        const img = await loadImage(p!.blob, 1800)
        if (!img) continue
        const ph = Math.min(maxH, (img.h / img.w) * pw)
        const iw = (img.w / img.h) * ph
        if (col === 0) ensure(ph + 4)
        doc.addImage(img.data, img.format, M + col * (pw + 4), y, Math.min(iw, pw), ph)
        rowH = Math.max(rowH, ph)
        col++
        if (col === cols) {
          y += rowH + 4
          col = 0
          rowH = 0
        }
      }
      if (col > 0) y += rowH + 4
    }
    y += 3
    rule()
    y += 6
  }

  // ---- Sjekkpunkter ----
  ensure(16)
  y += 2
  text('GJENNOMGÅTTE SJEKKPUNKTER', M, 9, 'bold', [71, 85, 105])
  y += 2.5
  rule()
  y += 6
  let n = 0
  for (const a of round.areas) {
    ensure(12)
    text(a.name, M, 10, 'bold', [15, 23, 42])
    y += 5.5
    for (const i of a.items) {
      n++
      const lines = wrap(`${n}. ${i.text}`, CW - 32, 9.5)
      ensure(lines.length * 4.6 + 2)
      const st = i.status ?? 'none'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...STATUS_COLOR[st])
      doc.text(i.status ? STATUS_TEXT[i.status] : 'Ikke sjekket', W - M, y, { align: 'right' })
      lines.forEach((l, k) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(30, 41, 59)
        doc.text(l, M + 2, y + k * 4.6)
      })
      y += lines.length * 4.6 + 1.8
    }
    y += 3
  }

  // ---- Oppsummering ----
  if (round.summary.trim()) {
    ensure(16)
    text('OPPSUMMERING', M, 9, 'bold', [71, 85, 105])
    y += 2.5
    rule()
    y += 6
    for (const l of wrap(round.summary, CW, 10)) {
      ensure(5)
      text(l, M, 10, 'normal', [30, 41, 59])
      y += 4.8
    }
    y += 4
  }

  // ---- Oppfølging ----
  if (round.areas.some((a) => a.items.some((i) => i.status === 'avvik'))) {
    ensure(30)
    text('OPPFØLGING AV AVVIK', M, 9, 'bold', [71, 85, 105])
    y += 2.5
    rule()
    y += 6
    const follow =
      'Leder bes bekrefte mottak av rapporten og gi skriftlig tilbakemelding på hvilke tiltak som iverksettes for avvikene, innen fristene som er angitt. Avvik som ikke er lukket ved fristen følges opp overfor ledelsen og kan tas opp i arbeidsmiljøutvalget (AMU). Ved overhengende fare for liv eller helse kan verneombudet stanse arbeidet, jf. arbeidsmiljøloven § 6-3.'
    for (const l of wrap(follow, CW, 9.5)) {
      ensure(5)
      text(l, M, 9.5, 'normal', [51, 65, 85])
      y += 4.6
    }
    y += 4
  }

  // ---- Signaturer ----
  ensure(48)
  y += 2
  text('SIGNATURER', M, 9, 'bold', [71, 85, 105])
  y += 2.5
  rule()
  y += 4
  const sigW = (CW - 6) / 2
  const sigs: [string, Signature | undefined][] = [
    ['Verneombud', round.signatures?.inspector],
    ['Leder / HMS-ansvarlig', round.signatures?.manager],
  ]
  for (let k = 0; k < 2; k++) {
    const [label, sig] = sigs[k]
    const x = M + k * (sigW + 6)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, sigW, 36, 2, 2, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(label, x + 3, y + 5)
    if (sig?.image) {
      const img = await dataUrlImage(sig.image)
      if (img) {
        const h = 18
        const w = Math.min(sigW - 8, (img.w / img.h) * h)
        doc.addImage(img.data, 'PNG', x + 4, y + 7, w, (img.h / img.w) * w > h ? h : (img.h / img.w) * w)
      }
    }
    doc.line(x + 3, y + 28, x + sigW - 3, y + 28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(sig?.name || ' ', x + 3, y + 32.5)
    if (sig?.signedAt) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(formatDate(sig.signedAt), x + sigW - 3, y + 32.5, { align: 'right' })
    }
  }

  // ---- Bunntekst ----
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`${settings.companyName || 'Vernerunde'} · ${round.title}`, M, 297 - 9)
    doc.text(`Side ${p} av ${pages}`, W - M, 297 - 9, { align: 'right' })
  }

  return doc.output('blob')
}
