import { ArrowRight, ShieldCheck } from '@phosphor-icons/react'
import { OrgForm } from '../components/OrgForm'
import { Button } from '../components/ui'
import { saveSettings } from '../lib/settings'
import type { OrgSettings } from '../types'

export function Welcome({ settings }: { settings: OrgSettings }) {
  const finish = () => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    setTimeout(() => saveSettings({ onboarded: true }), 0)
  }
  return (
    <div className="min-h-dvh">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pb-8 pt-[calc(40px+env(safe-area-inset-top,0px))] text-white">
        <div className="mx-auto max-w-2xl pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-600/40">
            <ShieldCheck size={34} weight="fill" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Velkommen til Vernerunde</h1>
          <p className="mt-2 max-w-md text-slate-300">
            Gjennomfør vernerunder på mobilen, dokumenter avvik med bilde, og lag signert PDF-rapport på stedet. Start med firmaprofilen. Du kan endre den senere.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pt-5">
        <OrgForm settings={settings} />
        <Button variant="primary" size="lg" block onClick={finish}>
          Kom i gang <ArrowRight size={20} weight="bold" />
        </Button>
        <Button variant="ghost" block onClick={() => saveSettings({ onboarded: true })}>
          Hopp over
        </Button>
      </div>
    </div>
  )
}
