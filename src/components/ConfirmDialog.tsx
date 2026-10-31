import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Button } from './ui'

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
    <div className="fixed inset-0 z-[60] flex animate-fade-in items-end justify-center bg-slate-950/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-center" onClick={() => answer(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-msg"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm animate-sheet-up flex-col gap-4 rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700"
      >
        <p id="dialog-msg" className="text-base font-medium text-slate-900 dark:text-white">
          {req.message}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => answer(false)}>Avbryt</Button>
          <Button ref={confirmBtn} variant={req.danger ? 'danger' : 'primary'} onClick={() => answer(true)}>
            {req.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
