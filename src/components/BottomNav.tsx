interface Props {
  active: 'runder' | 'maler'
}

export function BottomNav({ active }: Props) {
  return (
    <nav className="bottomnav" aria-label="Hovedmeny">
      <a href="#/" className={active === 'runder' ? 'active' : ''}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Vernerunder
      </a>
      <a href="#/maler" className={active === 'maler' ? 'active' : ''}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sjekklister
      </a>
    </nav>
  )
}
