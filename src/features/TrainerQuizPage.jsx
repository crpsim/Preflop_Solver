import { useEffect, useMemo, useState } from 'react'
import {
  ACTION_LABELS,
  BB_VALUES,
  SPOTS_BY_FORMAT,
  formatActionLabel,
  getActionsFromGrid,
  pickRandomHandForQuiz,
  resolveSpotAndTable,
} from './trainerUtils'

const STORAGE_KEY = 'trainer_quiz_stats_v1'
const baseButton = 'rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-[0.98]'

const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

const defaultPersistentStats = {
  totalAnswers: 0,
  correctAnswers: 0,
  bestStreak: 0,
  bySpot: {},
}

const loadPersistentStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersistentStats
    const parsed = JSON.parse(raw)
    return {
      totalAnswers: Number(parsed.totalAnswers) || 0,
      correctAnswers: Number(parsed.correctAnswers) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      bySpot: parsed.bySpot && typeof parsed.bySpot === 'object' ? parsed.bySpot : {},
    }
  } catch {
    return defaultPersistentStats
  }
}

export default function TrainerQuizPage() {
  const [format, setFormat] = useState('3W')
  const [spotKey, setSpotKey] = useState('RANDOM')
  const [depth, setDepth] = useState('RANDOM')
  const [difficulty, setDifficulty] = useState('medium')
  const [question, setQuestion] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const [sessionTotal, setSessionTotal] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)

  const [persistentStats, setPersistentStats] = useState(defaultPersistentStats)

  useEffect(() => {
    setPersistentStats(loadPersistentStats())
  }, [])

  useEffect(() => {
    setSpotKey('RANDOM')
    setQuestion(null)
    setFeedback(null)
  }, [format])

  const availableSpots = useMemo(() => SPOTS_BY_FORMAT[format] ?? [], [format])

  const updatePersistentStats = ({ spotId, isCorrect, nextStreak }) => {
    setPersistentStats((current) => {
      const currentBySpot = current.bySpot?.[spotId] ?? { total: 0, correct: 0 }
      const next = {
        totalAnswers: current.totalAnswers + 1,
        correctAnswers: current.correctAnswers + (isCorrect ? 1 : 0),
        bestStreak: Math.max(current.bestStreak, nextStreak),
        bySpot: {
          ...current.bySpot,
          [spotId]: {
            total: currentBySpot.total + 1,
            correct: currentBySpot.correct + (isCorrect ? 1 : 0),
          },
        },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const generateNewHand = () => {
    const effectiveBb = depth === 'RANDOM' ? randomItem(BB_VALUES) : Number(depth)
    const resolved = resolveSpotAndTable({ format, spotKey, effectiveBb })

    if (resolved.status !== 'ok') {
      setQuestion({
        status: resolved.status,
        message: resolved.message,
        format,
        heroPosition: resolved.spot?.heroPosition ?? '-',
        previousActions: resolved.spot?.previousActions ?? [],
        effectiveBb,
      })
      setFeedback(null)
      return
    }

    const hand = pickRandomHandForQuiz({
      grid: resolved.table.grid,
      difficulty,
    })

    const expectedAction = resolved.table.grid?.[hand]
    if (!expectedAction) {
      setQuestion({
        status: 'missing',
        message: 'Table manquante pour ce spot / cette profondeur.',
        format,
        heroPosition: resolved.spot.heroPosition,
        previousActions: resolved.spot.previousActions ?? [],
        effectiveBb,
      })
      setFeedback(null)
      return
    }

    setQuestion({
      status: 'ready',
      format,
      spotKey: resolved.spot.key,
      heroPosition: resolved.spot.heroPosition,
      previousActions: resolved.spot.previousActions ?? [],
      effectiveBb,
      hand,
      expectedAction,
      actions: getActionsFromGrid(resolved.table.grid),
    })
    setFeedback(null)
  }

  const answerQuestion = (selectedAction) => {
    if (!question || question.status !== 'ready' || feedback) return

    const isCorrect = selectedAction === question.expectedAction

    const nextTotal = sessionTotal + 1
    const nextCorrect = sessionCorrect + (isCorrect ? 1 : 0)
    const nextStreak = isCorrect ? sessionStreak + 1 : 0

    setSessionTotal(nextTotal)
    setSessionCorrect(nextCorrect)
    setSessionStreak(nextStreak)

    updatePersistentStats({
      spotId: question.spotKey,
      isCorrect,
      nextStreak,
    })

    setFeedback({
      isCorrect,
      selectedAction,
      expectedAction: question.expectedAction,
    })
  }

  const resetStats = () => {
    const shouldReset = window.confirm('Reset toutes les stats du Trainer ?')
    if (!shouldReset) return

    setSessionTotal(0)
    setSessionCorrect(0)
    setSessionStreak(0)
    setPersistentStats(defaultPersistentStats)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPersistentStats))
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:gap-4">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Spin &amp; Go helper</p>
            <h1 className="mt-1 text-lg font-bold sm:text-xl">Trainer Quiz</h1>
          </div>
          <button
            type="button"
            onClick={generateNewHand}
            className={`${baseButton} border-emerald-400 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-500/30`}
          >
            Nouvelle main
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1">
            <p className="text-slate-400">Session</p>
            <p className="font-semibold text-slate-100">{sessionCorrect} / {sessionTotal}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1">
            <p className="text-slate-400">Streak</p>
            <p className="font-semibold text-slate-100">{sessionStreak}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1">
            <p className="text-slate-400">Total</p>
            <p className="font-semibold text-slate-100">
              {persistentStats.correctAnswers} / {persistentStats.totalAnswers}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1">
            <p className="text-slate-400">Best streak</p>
            <p className="font-semibold text-slate-100">{persistentStats.bestStreak}</p>
          </div>
        </div>
      </header>

      <details open className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-300">
          Parametres d entrainement
        </summary>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {['3W', 'HU'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormat(item)}
                  className={`${baseButton} ${
                    format === item
                      ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                      : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Spot
              <select
                value={spotKey}
                onChange={(event) => setSpotKey(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
              >
                <option value="RANDOM">Aleatoire</option>
                {availableSpots.map((spot) => (
                  <option key={spot.key} value={spot.key}>
                    {spot.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Profondeur
              <select
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
              >
                <option value="RANDOM">Aleatoire</option>
                {BB_VALUES.map((bb) => (
                  <option key={bb} value={bb}>
                    {bb} bb
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Difficulte</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy', label: 'Easy' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Hard' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficulty(item.id)}
                  className={`${baseButton} px-2 py-2 text-xs ${
                    difficulty === item.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                      : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetStats}
              className={`${baseButton} border-rose-500/70 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/20`}
            >
              Reset stats
            </button>
          </div>
        </div>
      </details>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Question</h2>

        {!question && (
          <p className="mt-2 text-sm text-slate-300">
            Clique sur <span className="font-semibold">Nouvelle main</span> pour commencer.
          </p>
        )}

        {question && (
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div>
                <p className="text-slate-400">Format</p>
                <p className="font-semibold text-slate-100">{question.format}</p>
              </div>
              <div>
                <p className="text-slate-400">Ma position</p>
                <p className="font-semibold text-slate-100">{question.heroPosition ?? '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Actions precedentes</p>
                <p className="font-semibold text-slate-100">
                  {question.previousActions && question.previousActions.length > 0
                    ? question.previousActions.join(' | ')
                    : 'Aucune'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Profondeur</p>
                <p className="font-semibold text-slate-100">{question.effectiveBb}bb</p>
              </div>
              <div>
                <p className="text-slate-400">Main</p>
                <p className="font-semibold text-amber-200">{question.hand ?? '-'}</p>
              </div>
            </div>

            {question.status !== 'ready' && (
              <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-xs text-amber-200">
                {question.message}
              </p>
            )}

            {question.status === 'ready' && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Ton action</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {question.actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => answerQuestion(action)}
                      className={`${baseButton} px-2 py-2 text-xs ${
                        feedback?.selectedAction === action
                          ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100'
                          : 'border-slate-700 bg-slate-800/70 text-slate-100 hover:border-slate-500'
                      } ${feedback ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      {ACTION_LABELS[action] ?? action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {feedback && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  feedback.isCorrect
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                    : 'border-rose-500/50 bg-rose-500/10 text-rose-100'
                }`}
              >
                <p className="font-semibold">{feedback.isCorrect ? 'Correct' : 'Incorrect'}</p>
                <p className="mt-1">GTO: {formatActionLabel(feedback.expectedAction)}</p>
                <p>Ton choix: {formatActionLabel(feedback.selectedAction)}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
