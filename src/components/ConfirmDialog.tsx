import { useEffect, useRef, useSyncExternalStore } from 'react'

interface Request {
  message: string
  confirmLabel: string
  danger: boolean
  resolve: (ok: boolean) => void
}

let current: Request | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Viser en bekreftelsesdialog i appen og svarer true hvis brukeren bekrefter. */
// oxlint-disable-next-line react/only-export-components
export function ask(message: string, options: { confirmLabel?: string; danger?: boolean } = {}): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => {
    current = { message, confirmLabel: options.confirmLabel ?? 'OK', danger: options.danger ?? false, resolve }
    emit()
  })
}

function answer(ok: boolean) {
  const req = current
  current = null
  emit()
  req?.resolve(ok)
}

export function ConfirmHost() {
  const req = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
  const confirmBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!req) return
    confirmBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && answer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [req])

  if (!req) return null
  return (
    <div className="dialog-backdrop" onClick={() => answer(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-msg" onClick={(e) => e.stopPropagation()}>
        <p id="dialog-msg">{req.message}</p>
        <div className="button-row">
          <button type="button" className="btn" onClick={() => answer(false)}>
            Avbryt
          </button>
          <button
            ref={confirmBtn}
            type="button"
            className={`btn ${req.danger ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={() => answer(true)}
          >
            {req.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
