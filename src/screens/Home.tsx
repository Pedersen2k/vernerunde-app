import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Ring } from '../components/Ring'
import { db } from '../db'
import { formatDate } from '../lib/format'
import { roundStats } from '../lib/rounds'
import { useSettings } from '../lib/settings'
import type { Round } from '../types'

function RoundCard({ round }: { round: Round }) {
  const s = roundStats(round.areas)
  const done = round.finishedAt !== null
  return (
    <a className="round-card" href={`#/runde/${round.id}`}>
      {done ? (
        <div className="round-done-mark" aria-label="Fullført">
          <Icon name="check" size={22} stroke={2.6} />
        </div>
      ) : (
        <Ring value={s.checked} max={s.total} size={52} />
      )}
      <div className="grow">
        <h3>{round.title}</h3>
        <p className="meta-line">
          {round.location && (
            <span>
              <Icon name="pin" size={14} /> {round.location}
            </span>
          )}
          <span>
            <Icon name="calendar" size={14} /> {formatDate(round.finishedAt ?? round.startedAt)}
          </span>
        </p>
      </div>
      {s.avvik > 0 ? (
        <span className="badge badge-avvik">
          <Icon name="warning" size={14} stroke={2.4} />
          {s.avvik}
        </span>
      ) : (
        <Icon name="chevron" size={20} className="chev" />
      )}
    </a>
  )
}

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 10) return 'God morgen'
  if (h < 17) return 'God dag'
  return 'God kveld'
}

export function Home() {
  const settings = useSettings()
  const rounds = useLiveQuery(() => db.rounds.orderBy('startedAt').reverse().toArray(), [])
  const active = rounds?.filter((r) => !r.finishedAt) ?? []
  const done = rounds?.filter((r) => r.finishedAt) ?? []
  const openAvvik = rounds?.reduce((n, r) => n + roundStats(r.areas).avvik, 0) ?? 0
  const [now] = useState(() => new Date())
  const year = now.getFullYear()
  const doneThisYear = done.filter((r) => new Date(r.finishedAt!).getFullYear() === year).length
  const firstName = settings?.inspectorName.split(' ')[0]

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-brand">
            {settings && <Logo settings={settings} size={52} className="logo-on-brand" />}
            <div className="grow">
              <p className="eyebrow">{settings?.department || 'Vernerunde'}</p>
              <h1>{settings?.companyName || 'Vernerunder'}</h1>
            </div>
          </div>
          <p className="hero-greeting">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}.{' '}
            {active.length > 0
              ? `Du har ${active.length} ${active.length === 1 ? 'runde' : 'runder'} på gang.`
              : 'Klar for neste vernerunde?'}
          </p>
          <div className="hero-stats">
            <div>
              <strong>{active.length}</strong>
              <span>pågående</span>
            </div>
            <div>
              <strong>{openAvvik}</strong>
              <span>avvik registrert</span>
            </div>
            <div>
              <strong>{doneThisYear}</strong>
              <span>fullført i {year}</span>
            </div>
          </div>
        </div>
        <div className="hazard" aria-hidden="true" />
      </section>

      <main className="content content-under-hero">
        <a className="cta" href="#/ny">
          <span className="cta-icon">
            <Icon name="plus" size={26} stroke={2.4} />
          </span>
          <span className="grow">
            <strong>Start ny vernerunde</strong>
            <span>Velg sjekkliste og gå i gang</span>
          </span>
          <Icon name="chevron" size={22} />
        </a>

        {rounds && rounds.length === 0 && (
          <div className="empty">
            <div className="empty-mark">
              <Icon name="clipboard" size={30} />
            </div>
            <h2>Ingen vernerunder ennå</h2>
            <p>
              Start en runde med eksempelsjekklisten, eller lag din egen under <a href="#/maler">Sjekklister</a>.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <section className="stack">
            <h2 className="section-title">Pågående</h2>
            <div className="list">
              {active.map((r) => (
                <RoundCard key={r.id} round={r} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section className="stack">
            <h2 className="section-title">Fullførte</h2>
            <div className="list">
              {done.map((r) => (
                <RoundCard key={r.id} round={r} />
              ))}
            </div>
          </section>
        )}

        <p className="muted small center note">
          <Icon name="lock" size={14} /> Lagres på denne enheten og virker uten nett
        </p>
      </main>
      <BottomNav active="runder" />
    </>
  )
}
