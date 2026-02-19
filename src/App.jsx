import { useEffect, useState } from 'react'
import SelectionSituationPage from './features/SelectionSituationPage'
import TrainerQuizPage from './features/TrainerQuizPage'
import { DEFAULT_PROFILE, PROFILE_OPTIONS, normalizeProfile } from './ranges'

const NAV_ITEMS = [
  { id: 'selection', label: 'Selection situation' },
  { id: 'trainer', label: 'Trainer Quiz' },
]

export default function App() {
  const [activePage, setActivePage] = useState('selection')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)

  useEffect(() => {
    const saved = localStorage.getItem('opponent_profile_v1')
    if (saved) setProfile(normalizeProfile(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('opponent_profile_v1', normalizeProfile(profile))
  }, [profile])

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
        <section className="mb-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Profil adverse
            <select
              value={profile}
              onChange={(event) => setProfile(normalizeProfile(event.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            >
              {PROFILE_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-[11px] text-slate-400">
            {PROFILE_OPTIONS.find((item) => item.id === profile)?.description}
          </p>
        </section>

        {activePage === 'selection' ? (
          <SelectionSituationPage profile={profile} />
        ) : (
          <TrainerQuizPage profile={profile} />
        )}
      </div>
    </main>
  )
}
