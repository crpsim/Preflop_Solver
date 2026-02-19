import { useEffect, useState } from 'react'
import SelectionSituationPage from './features/SelectionSituationPage'
import TrainerQuizPage from './features/TrainerQuizPage'

const NAV_ITEMS = [
  { id: 'selection', label: 'Selection situation' },
  { id: 'trainer', label: 'Trainer Quiz' },
]

export default function App() {
  const [activePage, setActivePage] = useState('selection')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  const navigate = (pageId) => {
    setActivePage(pageId)
    setMenuOpen(false)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed left-3 top-3 z-40 rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-slate-100 shadow-md"
        aria-label="Ouvrir le menu"
      >
        <span className="block h-0.5 w-4 bg-slate-100" />
        <span className="mt-1 block h-0.5 w-4 bg-slate-100" />
        <span className="mt-1 block h-0.5 w-4 bg-slate-100" />
      </button>

      <div
        className={`fixed inset-0 z-30 bg-slate-950/70 transition ${menuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] border-r border-slate-800 bg-slate-900 p-4 transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Menu</p>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
          >
            Fermer
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                activePage === item.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="mx-auto w-full max-w-[560px] px-3 pb-4 pt-14 sm:px-4 sm:pt-16">
        {activePage === 'selection' ? <SelectionSituationPage /> : <TrainerQuizPage />}
      </div>
    </main>
  )
}
