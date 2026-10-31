import { X } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'

/** Bunnark (modal) som glir opp fra bunnen, slik som i Gemini-skissen. */
export function Sheet({ open, onClose, title, badge, children }: { open: boolean; onClose: () => void; title: string; badge?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg animate-sheet-up flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700/70">
          {badge}
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">{children}</div>
      </div>
    </div>
  )
}
