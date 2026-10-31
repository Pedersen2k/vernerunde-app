import { jsPDF } from 'jspdf'
import { db } from '../db'
import type { OrgSettings, ReportStyle, Round, Signature, Status } from '../types'
import { dueLabel, SEVERITY } from './deviations'
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

type RGB = [number, number, number]

const STATUS_TEXT: Record<Status, string> = { ok: 'OK', merknad: 'Merknad', avvik: 'Avvik', na: 'Ikke relevant' }
const STATUS_COLOR: Record<Status | 'none', RGB> = {
  ok: [22, 163, 74],
  merknad: [202, 138, 4],
  avvik: [220, 38, 38],
  na: [100, 116, 139],
  none: [148, 163, 184],
}
const INK: RGB = [15, 23, 42]
const MUTED: RGB = [100, 116, 139]
const SOFT: RGB = [71, 85, 105]
const LINE: RGB = [226, 232, 240]
const PANEL: RGB = [241, 245, 249]
const NAVY: RGB = [9, 13, 22]
const ORANGE: RGB = [234, 88, 12]

const SEV_COLOR = { lav: STATUS_COLOR.ok, middels: STATUS_COLOR.merknad, kritisk: STATUS_COLOR.avvik }

export async function buildReportPdf(round: Round, settings: OrgSettings, style: ReportStyle = settings.reportStyle ?? 'moderne'): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const M = 16
  const CW = W - 2 * M
  const TOP = 24 // startposisjon på side 2 og utover
  const BOTTOM = H - 20
  let y = M
  const accent: RGB = style === 'moderne' ? ORANGE : style === 'protokoll' ? [51, 65, 85] : [30, 41, 59]
  const s = roundStats(round.areas)
  const company = settings.companyName || 'Vernerunde'
  const refId = `VR-${new Date(round.startedAt).getFullYear()}-${round.id.slice(0, 6).toUpperCase()}`

  const font = (size: number, weight: 'normal' | 'bold' = 'normal', color: RGB = INK) => {
    doc.setFont('helvetica', weight)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  const text = (t: string, x: number, size = 10, weight: 'normal' | 'bold' = 'normal', color: RGB = INK, opts?: { align?: 'left' | 'right' | 'center' }) => {
    font(size, weight, color)
    doc.text(t, x, y, opts)
  }
  const wrap = (t: string, width: number, size: number, weight: 'normal' | 'bold' = 'normal') => {
    font(size, weight)
    return doc.splitTextToSize(t, width) as string[]
  }
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage()
      y = TOP
    }
  }
  const rule = (color: RGB = LINE, width = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(width)
    doc.line(M, y, W - M, y)
  }
  const fill = (c: RGB) => doc.setFillColor(...c)
  const chip = (label: string, color: RGB, xRight: number, baseline: number, w = 22) => {
    fill(color)
    doc.roundedRect(xRight - w, baseline - 4.2, w, 5.8, 1.4, 1.4, 'F')
    font(7.5, 'bold', [255, 255, 255])
    doc.text(label.toUpperCase(), xRight - w / 2, baseline, { align: 'center' })
  }
  const section = (title: string, need = 18) => {
    ensure(need)
    y += 3
    if (style === 'moderne') {
      fill(accent)
      doc.rect(M, y - 4.2, 1.6, 6, 'F')
      text(title.toUpperCase(), M + 4, 9.5, 'bold', INK)
      y += 3
    } else if (style === 'protokoll') {
      fill(accent)
      doc.rect(M, y - 5, CW, 7, 'F')
      text(title.toUpperCase(), M + 3, 8.5, 'bold', [255, 255, 255])
      y += 4
    } else {
      text(title.toUpperCase(), M, 9, 'bold', SOFT)
      y += 2.5
      rule(LINE, 0.3)
      y += 2
    }
    y += 4
  }

  // ---------- Logo ----------
  const logo = settings.logo ? await loadImage(settings.logo, 500, 'PNG') : null
  const drawLogo = (x: number, top: number, maxW: number, maxH: number, align: 'left' | 'right' | 'center' = 'left') => {
    if (!logo) return
    let h = maxH
    let w = (logo.w / logo.h) * h
    if (w > maxW) {
      w = maxW
      h = (logo.h / logo.w) * w
    }
    const dx = align === 'right' ? maxW - w : align === 'center' ? (maxW - w) / 2 : 0
    doc.addImage(logo.data, logo.format, x + dx, top + (maxH - h) / 2, w, h)
  }

  // ---------- Topp ----------
  if (style === 'klassisk') {
    drawLogo(W - M - 48, M - 2, 48, 18, 'right')
    y += 3
    text(company.toUpperCase(), M, 8.5, 'bold', MUTED)
    y += 8
    text('Vernerunderapport', M, 21, 'bold')
    y += 7
    for (const line of wrap(round.title, CW - 52, 11)) {
      text(line, M, 11, 'normal', SOFT)
      y += 5
    }
    y += 3
    rule(INK, 0.7)
    y += 8
  } else if (style === 'moderne') {
    fill(NAVY)
    doc.rect(0, 0, W, 44, 'F')
    fill(ORANGE)
    doc.rect(0, 44, W, 1.6, 'F')
    if (logo) {
      fill([255, 255, 255])
      doc.roundedRect(M, 9, 26, 26, 3.5, 3.5, 'F')
      drawLogo(M + 2, 11, 22, 22, 'center')
    }
    const tx = logo ? M + 33 : M
    y = 14
    text(company.toUpperCase(), tx, 8, 'bold', [251, 146, 60])
    y += 9
    text('Vernerunderapport', tx, 21, 'bold', [255, 255, 255])
    y += 7
    const sub = wrap(round.title, W - M - tx, 10.5)[0]
    text(sub, tx, 10.5, 'normal', [203, 213, 225])
    y += 6
    text(`${formatDate(round.startedAt)}  •  ${refId}`, tx, 8.5, 'normal', [148, 163, 184])
    y = 56
  } else {
    // protokoll: tabellhode med logo, tittel og dokumentinfo
    const h = 26
    doc.setDrawColor(...accent)
    doc.setLineWidth(0.5)
    doc.rect(M, y, CW, h, 'S')
    doc.line(M + 48, y, M + 48, y + h)
    doc.line(W - M - 52, y, W - M - 52, y + h)
    drawLogo(M + 3, y + 3, 42, h - 6, 'center')
    if (!logo) {
      y += 11
      text(company, M + 24, 9, 'bold', INK, { align: 'center' })
      y -= 11
    }
    y += 11
    text('PROTOKOLL', M + 48 + (CW - 100) / 2, 8, 'bold', MUTED, { align: 'center' })
    y += 8
    text('Vernerunde', M + 48 + (CW - 100) / 2, 17, 'bold', INK, { align: 'center' })
    y -= 19
    const rx = W - M - 49
    ;([['Dok.nr', refId], ['Dato', formatDate(round.startedAt)], ['Status', round.finishedAt ? 'Fullført' : 'Utkast']] as const).forEach(([k, v], i) => {
      y = M + 8 + i * 7
      text(k, rx, 7.5, 'bold', MUTED)
      text(v, rx + 14, 8.5, 'normal', INK)
    })
    y = M + h + 8
    text(round.title, M, 12, 'bold')
    y += 8
  }

  // ---------- Fakta ----------
  const facts: [string, string][] = [
    ['Dato', formatDate(round.startedAt)],
    ['Sted', round.location || '–'],
    ['Sjekkliste', round.templateName || '–'],
    ['Deltakere', round.participants || '–'],
    ['Utført av', round.signatures?.inspector?.name || settings.inspectorName || '–'],
    ['Mottaker (leder)', round.signatures?.manager?.name || settings.managerName || '–'],
    ['Status', round.finishedAt ? `Fullført ${formatDateTime(round.finishedAt)}` : 'Utkast (ikke fullført)'],
  ]
  if (style === 'klassisk') {
    for (const [k, v] of facts.filter(([k]) => k !== 'Utført av' && k !== 'Mottaker (leder)')) {
      const lines = wrap(v, CW - 34, 10)
      text(k, M, 9, 'bold', MUTED)
      lines.forEach((l, i) => {
        font(10, 'normal', INK)
        doc.text(l, M + 34, y + i * 4.6)
      })
      y += Math.max(1, lines.length) * 4.6 + 1.6
    }
    y += 3
  } else {
    const cw = (CW - 4) / 2
    const rows: [string, string][][] = []
    for (let i = 0; i < facts.length; i += 2) rows.push(facts.slice(i, i + 2))
    for (const row of rows) {
      const hs = row.map(([, v]) => wrap(v, cw - 8, 9.5, 'bold').length)
      const rh = 9 + Math.max(...hs) * 4.4
      ensure(rh + 2)
      row.forEach(([k, v], i) => {
        const x = M + i * (cw + 4)
        if (style === 'moderne') {
          fill(PANEL)
          doc.roundedRect(x, y, cw, rh, 2, 2, 'F')
        } else {
          doc.setDrawColor(...LINE)
          doc.setLineWidth(0.3)
          doc.rect(x, y, cw, rh, 'S')
        }
        font(7, 'bold', MUTED)
        doc.text(k.toUpperCase(), x + 4, y + 5)
        wrap(v, cw - 8, 9.5, 'bold').forEach((l, j) => {
          font(9.5, 'bold', INK)
          doc.text(l, x + 4, y + 10 + j * 4.4)
        })
      })
      y += rh + 2.5
    }
    y += 2
  }

  // ---------- Sammendrag ----------
  section('Sammendrag')
  const devs = round.areas.flatMap((a) => a.items.filter((i) => i.status === 'avvik' && i.deviation).map((i) => ({ a, i, d: i.deviation! })))
  const open = devs.filter((x) => !x.d.resolvedAt)
  const crit = devs.filter((x) => x.d.severity === 'kritisk').length
  const first = open.length ? Math.min(...open.map((x) => x.d.due)) : null
  const sum = [
    `Det ble kontrollert ${s.checked} av ${s.total} punkter, og ${s.score} % av de relevante punktene er godkjent.`,
    s.avvik || s.merknad
      ? `Det er registrert ${s.avvik} avvik${crit ? ` (${crit} kritisk${crit > 1 ? 'e' : ''})` : ''} og ${s.merknad} merknad${s.merknad === 1 ? '' : 'er'}.${first ? ` Første frist for tiltak er ${formatDate(first)}.` : ''}`
      : 'Det er ikke registrert avvik eller merknader.',
  ].join(' ')
  for (const l of wrap(sum, CW, 10)) {
    ensure(5)
    text(l, M, 10, 'normal', INK)
    y += 4.9
  }
  y += 3

  const boxes: [string, string, RGB][] = [
    ['Godkjent', `${s.score}%`, STATUS_COLOR.ok],
    ['OK', String(s.ok), STATUS_COLOR.ok],
    ['Merknader', String(s.merknad), STATUS_COLOR.merknad],
    ['Avvik', String(s.avvik), STATUS_COLOR.avvik],
    ['Ikke sjekket', String(s.total - s.checked), STATUS_COLOR.none],
  ]
  ensure(32)
  const gap = style === 'protokoll' ? 0 : 3
  const bw = (CW - 4 * gap) / 5
  boxes.forEach(([label, value, color], i) => {
    const x = M + i * (bw + gap)
    if (style === 'moderne') {
      fill(PANEL)
      doc.roundedRect(x, y, bw, 19, 2, 2, 'F')
      fill(color)
      doc.rect(x + 3, y, bw - 6, 1.2, 'F')
      font(16, 'bold', color)
      doc.text(value, x + bw / 2, y + 10.5, { align: 'center' })
      font(7.5, 'normal', SOFT)
      doc.text(label, x + bw / 2, y + 15.5, { align: 'center' })
    } else if (style === 'protokoll') {
      doc.setDrawColor(...accent)
      doc.setLineWidth(0.3)
      doc.rect(x, y, bw, 17, 'S')
      font(7, 'bold', MUTED)
      doc.text(label.toUpperCase(), x + bw / 2, y + 5, { align: 'center' })
      font(15, 'bold', color)
      doc.text(value, x + bw / 2, y + 13, { align: 'center' })
    } else {
      fill(PANEL)
      doc.roundedRect(x, y, bw, 17, 2, 2, 'F')
      font(15, 'bold', color)
      doc.text(value, x + 4, y + 8.5)
      font(7.5, 'normal', SOFT)
      doc.text(label, x + 4, y + 13.5)
    }
  })
  y += style === 'moderne' ? 23 : 21
  // Fordelingsstolpe
  if (s.checked > 0) {
    let x = M
    for (const [n, color] of [[s.ok, STATUS_COLOR.ok], [s.merknad, STATUS_COLOR.merknad], [s.avvik, STATUS_COLOR.avvik], [s.na, STATUS_COLOR.na]] as [number, RGB][]) {
      if (!n) continue
      const w = (n / s.checked) * CW
      fill(color)
      doc.rect(x, y, w, 3, 'F')
      x += w
    }
    y += 9
  }

  // ---------- Tiltaksplan ----------
  if (devs.length) {
    section('Tiltaksplan')
    const cols = [M, M + 9, M + 82, M + 108, M + 142, W - M] // nr | avvik | alvorlighet | ansvarlig | frist | status
    const head = () => {
      ensure(14)
      if (style === 'klassisk') {
        rule(INK, 0.5)
        y += 4.5
      } else {
        fill(style === 'moderne' ? NAVY : accent)
        doc.rect(M, y - 4.4, CW, 6.8, 'F')
        y += 0.2
      }
      const c: RGB = style === 'klassisk' ? INK : [255, 255, 255]
      ;['Nr', 'Avvik / sone', 'Alvorlighet', 'Ansvarlig', 'Frist', 'Status'].forEach((t, i) => text(t, i === 5 ? W - M - 2 : cols[i] + (style === 'klassisk' ? 0 : 2), 8, 'bold', c, i === 5 ? { align: 'right' } : undefined))
      y += style === 'klassisk' ? 2.5 : 4.5
      if (style === 'klassisk') {
        rule(INK, 0.5)
        y += 0
      }
    }
    head()
    devs
      .sort((a, b) => a.d.due - b.d.due)
      .forEach(({ a, i, d }, k) => {
        const l1 = wrap(i.text, cols[2] - cols[1] - 3, 9, 'bold')
        const l2 = wrap(d.responsible || 'Ikke tildelt', cols[4] - cols[3] - 3, 8.5)
        const rh = Math.max(l1.length * 4.1 + 5.5, l2.length * 4 + 3, 9)
        if (y + rh > BOTTOM) {
          doc.addPage()
          y = TOP
          head()
        }
        const top = y
        if (style !== 'klassisk' && k % 2 === 1) {
          fill([248, 250, 252])
          doc.rect(M, top - 1, CW, rh, 'F')
        }
        const pad = style === 'klassisk' ? 0 : 2
        y = top + 3
        text(String(k + 1), cols[0] + pad, 9, 'bold', MUTED)
        l1.forEach((l, j) => {
          font(9, 'bold', INK)
          doc.text(l, cols[1] + pad, top + 3 + j * 4.1)
        })
        font(7.5, 'normal', MUTED)
        doc.text(a.name, cols[1] + pad, top + 3 + l1.length * 4.1)
        fill(SEV_COLOR[d.severity])
        doc.roundedRect(cols[2] + pad, top - 0.8, 20, 5, 1.2, 1.2, 'F')
        font(7, 'bold', [255, 255, 255])
        doc.text(SEVERITY[d.severity].label.toUpperCase(), cols[2] + pad + 10, top + 2.7, { align: 'center' })
        l2.forEach((l, j) => {
          font(8.5, 'normal', INK)
          doc.text(l, cols[3] + pad, top + 3 + j * 4)
        })
        font(8.5, 'bold', INK)
        doc.text(new Date(d.due).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }), cols[4] + pad, top + 3)
        font(8, 'bold', d.resolvedAt ? STATUS_COLOR.ok : STATUS_COLOR.avvik)
        doc.text(d.resolvedAt ? 'Utbedret' : 'Åpent', W - M - 2, top + 3, { align: 'right' })
        y = top + rh
        doc.setDrawColor(...LINE)
        doc.setLineWidth(0.2)
        doc.line(M, y - 1, W - M, y - 1)
      })
    y += 4
  }

  // ---------- Funn ----------
  const findings = round.areas.flatMap((a) => a.items.filter((i) => i.status === 'avvik' || i.status === 'merknad').map((i) => ({ a, i })))
  section('Avvik og merknader', findings.length ? 130 : 30)
  if (findings.length === 0) {
    text('Ingen avvik eller merknader registrert.', M, 10, 'normal', MUTED)
    y += 8
  }
  let fn = 0
  for (const { a, i } of findings) {
    fn++
    const color = STATUS_COLOR[i.status!]
    const titleLines = wrap(`${fn}. ${i.text}`, CW - 34, 10.5, 'bold')
    const inset = style === 'moderne' ? 5 : style === 'protokoll' ? 3 : 0
    const meta = [a.name]
    if (i.status === 'avvik' && i.deviation) {
      meta.push(`Alvorlighet: ${SEVERITY[i.deviation.severity].label}`)
      meta.push(i.deviation.resolvedAt ? `Utbedret ${formatDate(i.deviation.resolvedAt)}` : `Frist ${formatDate(i.deviation.due)} (${dueLabel(i.deviation).toLowerCase()})`)
      if (i.deviation.responsible) meta.push(`Ansvarlig: ${i.deviation.responsible}`)
    }
    const metaLines = wrap(meta.join('   •   '), CW - inset * 2, 8.5)
    const commentLines = i.comment ? wrap(i.comment, CW - inset * 2, 10) : []
    const imgs = (await Promise.all((await db.photos.bulkGet(i.photoIds)).filter(Boolean).map((p) => loadImage(p!.blob, 1800)))).filter(Boolean) as Img[]
    const pcols = imgs.length === 1 ? 1 : 2
    const ppw = (CW - inset * 2 - (pcols - 1) * 4) / pcols
    const pmaxH = pcols === 1 ? 105 : 80
    const firstRow = imgs.slice(0, pcols).reduce((m, im) => Math.max(m, Math.min(pmaxH, (im.h / im.w) * ppw)), 0)
    // Hold overskrift, tekst og første bilderad sammen, så siden ikke får et stort tomrom
    ensure(titleLines.length * 5 + metaLines.length * 4.2 + commentLines.length * 4.8 + (firstRow ? firstRow + 6 : 4) + 8)
    const startPage = doc.getCurrentPageInfo().pageNumber
    const startY = y
    if (style === 'protokoll') {
      fill(PANEL)
      doc.rect(M, y - 4.5, CW, titleLines.length * 5 + 2.5, 'F')
    }
    chip(STATUS_TEXT[i.status!], color, W - M - (style === 'klassisk' ? 0 : 2), y)
    titleLines.forEach((l) => {
      text(l, M + inset, 10.5, 'bold')
      y += 5
    })
    if (style === 'protokoll') y += 1.5
    for (const l of metaLines) {
      text(l, M + inset, 8.5, 'normal', MUTED)
      y += 4.2
    }
    if (commentLines.length) {
      y += 1
      for (const l of commentLines) {
        ensure(5)
        text(l, M + inset, 10, 'normal', [30, 41, 59])
        y += 4.8
      }
    }
    // Bilder: ett stort alene, ellers to i bredden
    if (imgs.length) {
      y += 2
      let col = 0
      let rowH = 0
      for (const img of imgs) {
        const ph = Math.min(pmaxH, (img.h / img.w) * ppw)
        const iw = (img.w / img.h) * ph
        if (col === 0) ensure(ph + 4)
        const x = M + inset + col * (ppw + 4)
        doc.addImage(img.data, img.format, x, y, Math.min(iw, ppw), ph)
        doc.setDrawColor(...LINE)
        doc.setLineWidth(0.2)
        doc.rect(x, y, Math.min(iw, ppw), ph, 'S')
        rowH = Math.max(rowH, ph)
        col++
        if (col === pcols) {
          y += rowH + 4
          col = 0
          rowH = 0
        }
      }
      if (col > 0) y += rowH + 4
    }
    y += 1
    // Ramme rundt hvert funn
    if (doc.getCurrentPageInfo().pageNumber === startPage) {
      if (style === 'moderne') {
        fill(color)
        doc.rect(M, startY - 4.5, 1.4, y - startY + 4, 'F')
      } else if (style === 'protokoll') {
        doc.setDrawColor(...accent)
        doc.setLineWidth(0.3)
        doc.rect(M, startY - 4.5, CW, y - startY + 4.5, 'S')
      }
    }
    if (style === 'klassisk') {
      y += 2
      rule()
      y += 6
    } else y += 6
  }

  // ---------- Sjekkpunkter ----------
  section('Gjennomgåtte sjekkpunkter')
  let n = 0
  for (const a of round.areas) {
    const st = roundStats([a])
    ensure(18)
    fill(style === 'moderne' ? NAVY : PANEL)
    doc.roundedRect(M, y - 4.6, CW, 7, style === 'protokoll' ? 0 : 1.5, style === 'protokoll' ? 0 : 1.5, 'F')
    text(a.name, M + 3, 9.5, 'bold', style === 'moderne' ? [255, 255, 255] : INK)
    text(`${st.ok} av ${st.total - st.na} OK`, W - M - 3, 8, 'normal', style === 'moderne' ? [203, 213, 225] : SOFT, { align: 'right' })
    y += 6.5
    for (const i of a.items) {
      n++
      const lines = wrap(`${n}. ${i.text}`, CW - 40, 9.5)
      ensure(lines.length * 4.6 + 3)
      const st2 = i.status ?? 'none'
      lines.forEach((l, k) => {
        font(9.5, 'normal', [30, 41, 59])
        doc.text(l, M + 3, y + k * 4.6)
      })
      font(8.5, 'bold', STATUS_COLOR[st2])
      doc.text(i.status ? STATUS_TEXT[i.status] : 'Ikke sjekket', W - M - 3, y, { align: 'right' })
      y += lines.length * 4.6 + 2.2
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.15)
      doc.line(M, y - 3.9, W - M, y - 3.9)
    }
    y += 3
  }

  // ---------- Oppsummering fra verneombud ----------
  if (round.summary.trim()) {
    section('Verneombudets oppsummering')
    for (const l of wrap(round.summary, CW, 10)) {
      ensure(5)
      text(l, M, 10, 'normal', [30, 41, 59])
      y += 4.8
    }
    y += 4
  }

  // ---------- Oppfølging ----------
  if (devs.length) {
    section('Oppfølging av avvik')
    const follow =
      'Leder bes bekrefte mottak av rapporten og gi skriftlig tilbakemelding på hvilke tiltak som iverksettes for avvikene, innen fristene som er angitt. Avvik som ikke er lukket ved fristen følges opp overfor ledelsen og kan tas opp i arbeidsmiljøutvalget (AMU). Ved overhengende fare for liv eller helse kan verneombudet stanse arbeidet, jf. arbeidsmiljøloven § 6-3.'
    for (const l of wrap(follow, CW, 9.5)) {
      ensure(5)
      text(l, M, 9.5, 'normal', [51, 65, 85])
      y += 4.6
    }
    y += 4
  }

  // ---------- Signaturer ----------
  ensure(58)
  section('Signaturer')
  const sigW = (CW - 6) / 2
  const sigs: [string, Signature | undefined][] = [
    ['Verneombud', round.signatures?.inspector],
    ['Leder / HMS-ansvarlig (mottatt)', round.signatures?.manager],
  ]
  for (let k = 0; k < 2; k++) {
    const [label, sig] = sigs[k]
    const x = M + k * (sigW + 6)
    doc.setDrawColor(...(style === 'klassisk' ? [203, 213, 225] : accent) as RGB)
    doc.setLineWidth(style === 'protokoll' ? 0.4 : 0.3)
    if (style === 'protokoll') doc.rect(x, y, sigW, 38, 'S')
    else doc.roundedRect(x, y, sigW, 38, 2, 2, 'S')
    font(7.5, 'bold', MUTED)
    doc.text(label.toUpperCase(), x + 3, y + 5)
    if (sig?.image) {
      const img = await dataUrlImage(sig.image)
      if (img) {
        const h = 19
        const w = Math.min(sigW - 8, (img.w / img.h) * h)
        doc.addImage(img.data, 'PNG', x + 4, y + 7, w, (img.h / img.w) * w > h ? h : (img.h / img.w) * w)
      }
    }
    doc.setDrawColor(...LINE)
    doc.line(x + 3, y + 29, x + sigW - 3, y + 29)
    font(9, 'bold', INK)
    doc.text(sig?.name || ' ', x + 3, y + 34)
    if (sig?.signedAt) {
      font(7.5, 'normal', MUTED)
      doc.text(formatDate(sig.signedAt), x + sigW - 3, y + 34, { align: 'right' })
    }
  }
  y += 42

  // ---------- Topp- og bunntekst ----------
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    if (p > 1) {
      if (style === 'moderne') {
        fill(NAVY)
        doc.rect(0, 0, W, 11, 'F')
        fill(ORANGE)
        doc.rect(0, 11, W, 0.8, 'F')
        font(8, 'bold', [255, 255, 255])
        doc.text(company.toUpperCase(), M, 7)
        font(8, 'normal', [203, 213, 225])
        doc.text(`Vernerunderapport  •  ${refId}`, W - M, 7, { align: 'right' })
      } else {
        font(8, 'bold', SOFT)
        doc.text(company, M, 12)
        font(8, 'normal', MUTED)
        doc.text(`Vernerunderapport  •  ${refId}`, W - M, 12, { align: 'right' })
        doc.setDrawColor(...(style === 'protokoll' ? accent : LINE))
        doc.setLineWidth(0.3)
        doc.line(M, 14.5, W - M, 14.5)
      }
    }
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(M, H - 13, W - M, H - 13)
    font(7.5, 'normal', [148, 163, 184])
    doc.text(`${company}  •  ${round.title}`, M, H - 8.5)
    doc.text(`Side ${p} av ${pages}`, W - M, H - 8.5, { align: 'right' })
    doc.text('Laget med Vernerunde Pro', W / 2 + 28, H - 8.5, { align: 'center' })
  }

  return doc.output('blob')
}
