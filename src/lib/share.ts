type Downloads = { save(r: { filename: string; data: Blob }): Promise<unknown> }

/** I forhåndsvisningen på claude.ai går nedlasting via vertens egen lagringsdialog. */
async function hostDownloads(): Promise<Downloads | null> {
  if (window.self === window.top) return null
  const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude
  if (!c?.use) return null
  try {
    return (await c.use('downloads')) as Downloads | null
  } catch {
    return null
  }
}

/** Deler filen via telefonens delingsmeny (e-post, Teams osv.), eller laster den ned. */
export async function shareOrDownload(blob: Blob, filename: string, title: string, type = 'application/pdf'): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  const file = new File([blob], filename, { type })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text: title })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled'
    }
  }
  return (await downloadBlob(blob, filename)) ? 'downloaded' : 'failed'
}

export async function downloadBlob(blob: Blob, filename: string): Promise<boolean> {
  const host = await hostDownloads()
  if (host) {
    try {
      await host.save({ filename, data: blob })
      return true
    } catch {
      return false
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}
