import { useEffect, useMemo, useState } from 'react'
import { PROFILE_LABELS, getAction, resolveSelectionContextToLookup } from '../ranges'
import { formatActionLabel } from './trainerUtils'

const POSITIONS_3W = [
  { id: 'BTN', label: 'Bouton' },
  { id: 'SB', label: 'Small Blind' },
  { id: 'BB', label: 'Big Blind' },
]

const POSITIONS_HU = [
  { id: 'BTN_SB', label: 'BTN / SB' },
  { id: 'BB', label: 'Big Blind' },
]

const ACTIONS = [
  { id: 'fold', label: 'Fold' },
  { id: 'limp', label: 'Limp' },
  { id: 'open', label: 'Open' },
  { id: 'shove', label: 'Shove' },
]

const ACTION_ORDER_BY_HERO_POSITION = {
  BTN: [],
  SB: ['BTN'],
  BB: ['BTN', 'SB'],
}

const GAME_FORMATS = [
  { id: '3W', label: '3W' },
  { id: 'HU', label: 'HU' },
]

const HU_OPPONENT_ACTIONS = [
  { id: 'open', label: 'Open' },
  { id: 'limp', label: 'Limp' },
  { id: 'shove', label: 'Shove' },
]

const RANKS = [
  { id: '2', label: '2', short: '2' },
  { id: '3', label: '3', short: '3' },
  { id: '4', label: '4', short: '4' },
  { id: '5', label: '5', short: '5' },
  { id: '6', label: '6', short: '6' },
  { id: '7', label: '7', short: '7' },
  { id: '8', label: '8', short: '8' },
  { id: '9', label: '9', short: '9' },
  { id: '10', label: '10', short: '10' },
  { id: 'Valet', label: 'Valet', short: 'V' },
  { id: 'Dame', label: 'Dame', short: 'D' },
  { id: 'Roi', label: 'Roi', short: 'R' },
  { id: 'As', label: 'As', short: 'A' },
]

const HAND_SUITS = [
  { id: 'suited', label: 'Suited' },
  { id: 'offsuited', label: 'Offsuited' },
]

const SOLVER_RANK_MAP = {
  As: 'A',
  Roi: 'K',
  Dame: 'Q',
  Valet: 'J',
  '10': 'T',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
}

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

const baseButton = 'rounded-lg border px-3 py-2 text-sm font-semibold transition active:scale-[0.98]'

const MIN_EFFECTIVE_BB = 5
const MAX_EFFECTIVE_BB = 25
const EFFECTIVE_BB_STEP = 5

const normalizePreAction = (action) => {
  if (action === 'call') return 'limp'
  if (action === 'raise') return 'open'
  return action
}

const resolveBbSpot = (btnActionRaw, sbActionRaw) => {
  const btnAction = normalizePreAction(btnActionRaw)
  const sbAction = normalizePreAction(sbActionRaw)

  if (!btnAction || !sbAction) return null

  if (btnAction === 'open' && sbAction === 'fold') {
    return { mode: 'bb_vs_open', key: 'BTN_OPEN', label: 'BB vs BTN Open' }
  }

  if (btnAction === 'fold' && sbAction === 'open') {
    return { mode: 'bb_vs_open', key: 'SB_OPEN', label: 'BB vs SB Open' }
  }

  if (btnAction === 'open' && sbAction === 'limp') {
    return { mode: 'bb_vs_open', key: 'BTN_OPEN_SB_CALL', label: 'BB vs BTN Open + SB Call' }
  }

  if (btnAction === 'limp' && sbAction === 'fold') {
    return { mode: 'bb_vs_limp', key: 'bb_vs_btn_limp', label: 'BB vs BTN Limp' }
  }

  if (btnAction === 'fold' && sbAction === 'limp') {
    return { mode: 'bb_vs_limp', key: 'bb_vs_sb_limp', label: 'BB vs SB Limp' }
  }

  if (btnAction === 'limp' && sbAction === 'limp') {
    return { mode: 'bb_vs_limp', key: 'bb_vs_limp', label: 'BB vs Double Limp' }
  }

  if (btnAction === 'shove' && sbAction === 'fold') {
    return { mode: 'bb_vs_shove', key: 'bb_vs_btn', label: 'BB vs BTN Shove' }
  }

  if (btnAction === 'shove' && sbAction === 'limp') {
    return {
      mode: 'bb_vs_sb_equivalent_shove',
      key: 'sb_vs_btn',
      label: 'BB vs BTN Shove + SB Limp (equivalent SB vs BTN Shove)',
    }
  }

  if (btnAction === 'fold' && sbAction === 'shove') {
    return { mode: 'bb_vs_shove', key: 'bb_vs_sb', label: 'BB vs SB Shove' }
  }

  if (btnAction === 'shove' && sbAction === 'shove') {
    return { mode: 'bb_vs_shove', key: 'bb_vs_2_shove', label: 'BB vs 2 Shoves' }
  }

  return null
}

const resolveSbSpot = (btnActionRaw) => {
  const btnAction = normalizePreAction(btnActionRaw)
  if (!btnAction) return null

  if (btnAction === 'fold') {
    return { mode: 'open_3way', tablePosition: 'SB', scenarioLabel: 'SB Open (BTN fold)' }
  }

  if (btnAction === 'open') {
    return { mode: 'sb_vs_open', key: 'BTN_OPEN', label: 'SB vs BTN Open' }
  }

  if (btnAction === 'limp') {
    return { mode: 'sb_vs_limp', key: 'sb_vs_btn_limp', label: 'SB vs BTN Limp' }
  }

  if (btnAction === 'shove') {
    return { mode: 'sb_vs_shove', key: 'sb_vs_btn', label: 'SB vs BTN Shove' }
  }

  return null
}

export default function SelectionSituationPage({ profile }) {
  const [gameFormat, setGameFormat] = useState('3W')
  const [heroPosition, setHeroPosition] = useState(null)
  const [huOpponentAction, setHuOpponentAction] = useState(null)
  const [handSuitType, setHandSuitType] = useState('suited')
  const [effectiveBb, setEffectiveBb] = useState(25)
  const [actionsByPosition, setActionsByPosition] = useState({ BTN: null, SB: null, BB: null })
  const [cards, setCards] = useState([
    { rank: null },
    { rank: null },
  ])

  const positionOptions = gameFormat === 'HU' ? POSITIONS_HU : POSITIONS_3W

  useEffect(() => {
    setHeroPosition(null)
    setHuOpponentAction(null)
    setActionsByPosition({ BTN: null, SB: null, BB: null })
  }, [gameFormat])

  const visibleActionPositions = useMemo(() => {
    if (gameFormat !== '3W') return []
    if (!heroPosition) return []
    const visibleIds = ACTION_ORDER_BY_HERO_POSITION[heroPosition] ?? []
    return POSITIONS_3W.filter((position) => visibleIds.includes(position.id))
  }, [gameFormat, heroPosition])

  const rankStrength = useMemo(() => {
    return RANK_ORDER.reduce((accumulator, rank, index) => {
      accumulator[rank] = RANK_ORDER.length - index
      return accumulator
    }, {})
  }, [])

  const handKey = useMemo(() => {
    const [firstCard, secondCard] = cards
    if (!firstCard.rank || !secondCard.rank) return null

    if (firstCard.rank === secondCard.rank) {
      const pairRank = SOLVER_RANK_MAP[firstCard.rank]
      return pairRank ? `${pairRank}${pairRank}` : null
    }

    const firstRank = SOLVER_RANK_MAP[firstCard.rank]
    const secondRank = SOLVER_RANK_MAP[secondCard.rank]
    if (!firstRank || !secondRank) return null

    const firstIsHigher = rankStrength[firstRank] >= rankStrength[secondRank]
    const highRank = firstIsHigher ? firstRank : secondRank
    const lowRank = firstIsHigher ? secondRank : firstRank
    const suitedFlag = handSuitType === 'suited' ? 's' : 'o'

    return `${highRank}${lowRank}${suitedFlag}`
  }, [cards, handSuitType, rankStrength])

  const decisionContext = useMemo(() => {
    if (!heroPosition) return { status: 'incomplete', message: 'Choisis ta position pour obtenir une action.' }
    if (!handKey) return { status: 'incomplete', message: 'Choisis tes deux cartes pour obtenir une action.' }

    if (gameFormat === 'HU') {
      if (heroPosition === 'BTN_SB') {
        return {
          status: 'ready',
          mode: 'hu',
          scenario: 'BTN_SB_OPEN',
          scenarioLabel: 'HU BTN/SB Open',
        }
      }

      if (heroPosition === 'BB') {
        if (!huOpponentAction) {
          return { status: 'blocked', message: 'En HU BB, choisis l action adverse: open, limp ou shove.' }
        }

        const huScenarioByAction = {
          open: { scenario: 'BB_vs_OPEN', label: 'HU BB vs Open' },
          limp: { scenario: 'BB_vs_LIMP', label: 'HU BB vs Limp' },
          shove: { scenario: 'CALL_OPEN_SHOVE', label: 'HU BB vs Shove' },
        }

        const mapped = huScenarioByAction[huOpponentAction]
        if (!mapped) {
          return { status: 'blocked', message: 'Action HU non supportee.' }
        }

        return {
          status: 'ready',
          mode: 'hu',
          scenario: mapped.scenario,
          scenarioLabel: mapped.label,
        }
      }

      return { status: 'blocked', message: 'Position HU non supportee.' }
    }

    if (heroPosition === 'BTN') {
      return { status: 'ready', mode: 'open_3way', tablePosition: 'BTN', scenarioLabel: 'BTN Open' }
    }

    if (heroPosition === 'SB') {
      const sbSpot = resolveSbSpot(actionsByPosition.BTN)
      if (!sbSpot) {
        return {
          status: 'blocked',
          message: 'Selectionne une action BTN couverte (open, limp, shove ou fold) pour SB.',
        }
      }
      return { status: 'ready', ...sbSpot }
    }

    if (heroPosition === 'BB') {
      const bbSpot = resolveBbSpot(actionsByPosition.BTN, actionsByPosition.SB)
      if (!bbSpot) {
        return {
          status: 'blocked',
          message:
            'Selectionne une combinaison BTN/SB couverte (open, limp ou shove) pour BB.',
        }
      }

      return { status: 'ready', ...bbSpot }
    }

    return { status: 'blocked', message: 'Aucune table ouverte configuree pour cette situation.' }
  }, [actionsByPosition.BTN, actionsByPosition.SB, gameFormat, handKey, heroPosition, huOpponentAction])

  const decisionResult = useMemo(() => {
    if (decisionContext.status !== 'ready') return null

    const lookup = resolveSelectionContextToLookup(decisionContext)
    if (!lookup) return { status: 'error', message: 'Scenario non supporte.' }

    const resolved = getAction({
      format: lookup.format,
      spotKey: lookup.spotKey,
      effectiveBb,
      handCode: handKey,
      profile,
    })

    if (resolved.status !== 'ok') {
      return {
        status: 'error',
        message:
          resolved.message ??
          `Table introuvable (${decisionContext.scenarioLabel ?? decisionContext.label}, ${effectiveBb} BB).`,
      }
    }

    return {
      status: 'ok',
      action: resolved.action,
      actionLabel: formatActionLabel(resolved.action),
      scenarioLabel: decisionContext.scenarioLabel ?? decisionContext.label ?? resolved.spot.label,
      source: resolved.source,
      profile: resolved.profile,
    }
  }, [decisionContext, effectiveBb, handKey, profile])

  const setCardField = (cardIndex, field, value) => {
    setCards((current) =>
      current.map((card, index) => (index === cardIndex ? { ...card, [field]: value } : card)),
    )
  }

  const normalizeBb = (value) => {
    if (Number.isNaN(value)) return MIN_EFFECTIVE_BB
    const clamped = Math.min(MAX_EFFECTIVE_BB, Math.max(MIN_EFFECTIVE_BB, value))
    return Math.round(clamped / EFFECTIVE_BB_STEP) * EFFECTIVE_BB_STEP
  }

  const formatCard = (card) => {
    if (!card.rank) return 'En attente'
    return card.rank
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:gap-4">

        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Spin &amp; Go helper</p>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">Selection de situation</h1>
          <p className="mt-1 text-xs text-slate-400">
            Profil actif: <span className="font-semibold text-slate-200">{PROFILE_LABELS[profile] ?? PROFILE_LABELS.gto}</span>
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
                Format
              </h2>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {GAME_FORMATS.map((format) => {
                  const active = gameFormat === format.id
                  return (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => setGameFormat(format.id)}
                      className={`${baseButton} ${
                        active
                          ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                          : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {format.label}
                    </button>
                  )
                })}
              </div>

              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
                Ta position
              </h2>
              <div className={`grid grid-cols-1 gap-2 ${gameFormat === 'HU' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {positionOptions.map((position) => {
                  const active = heroPosition === position.id
                  return (
                    <button
                      key={position.id}
                      type="button"
                      onClick={() => setHeroPosition(position.id)}
                      className={`${baseButton} ${
                        active
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                          : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {position.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  BB effectives
                </p>
                <p className="text-sm font-bold text-amber-200">{effectiveBb} BB</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={MIN_EFFECTIVE_BB}
                  max={MAX_EFFECTIVE_BB}
                  step={EFFECTIVE_BB_STEP}
                  value={effectiveBb}
                  onChange={(event) => setEffectiveBb(normalizeBb(Number(event.target.value)))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-amber-400"
                />
                <input
                  type="number"
                  min={MIN_EFFECTIVE_BB}
                  max={MAX_EFFECTIVE_BB}
                  step={EFFECTIVE_BB_STEP}
                  value={effectiveBb}
                  onChange={(event) => setEffectiveBb(normalizeBb(Number(event.target.value)))}
                  className="w-16 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </section>

        {gameFormat === 'HU' && heroPosition === 'BB' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
              Action adverse (HU)
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {HU_OPPONENT_ACTIONS.map((action) => {
                const active = huOpponentAction === action.id
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setHuOpponentAction(action.id)}
                    className={`${baseButton} px-2 py-2 text-xs sm:text-sm ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                        : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {action.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {visibleActionPositions.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
              Actions des autres joueurs
            </h2>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {visibleActionPositions.map((position) => (
                <div key={position.id} className="rounded-xl border border-slate-800 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">{position.label}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ACTIONS.map((action) => {
                      const active = actionsByPosition[position.id] === action.id
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() =>
                            setActionsByPosition((current) => ({
                              ...current,
                              [position.id]: action.id,
                            }))
                          }
                          className={`${baseButton} px-2 py-2 text-xs sm:text-sm ${
                            active
                              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                              : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Selection des cartes
          </h2>

          <div className="space-y-3">
            {cards.map((card, cardIndex) => (
              <div key={cardIndex} className="rounded-xl border border-slate-800 p-2 sm:p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-200">Carte {cardIndex + 1}</p>
                  <p className="text-xs text-slate-300 sm:text-sm">{formatCard(card)}</p>
                </div>

                <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="grid grid-cols-7 gap-1">
                      {RANKS.map((rank) => {
                        const active = card.rank === rank.id
                        return (
                          <button
                            key={rank.id}
                            type="button"
                            onClick={() => setCardField(cardIndex, 'rank', rank.id)}
                            title={rank.label}
                            className={`${baseButton} min-w-0 px-1 py-1 text-[11px] sm:text-xs ${
                              active
                                ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                : 'border-slate-700 bg-slate-800/70 text-slate-100 hover:border-slate-500'
                            }`}
                          >
                            {rank.short}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-slate-800 p-2 sm:p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-200">Type de main</p>
                <p className="text-xs text-slate-300">
                  {cards[0].rank && cards[1].rank && cards[0].rank === cards[1].rank
                    ? 'Paire'
                    : handSuitType}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HAND_SUITS.map((type) => {
                  const isPair =
                    cards[0].rank && cards[1].rank && cards[0].rank === cards[1].rank
                  const active = handSuitType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={isPair}
                      onClick={() => setHandSuitType(type.id)}
                      className={`${baseButton} px-2 py-2 text-xs sm:text-sm ${
                        isPair
                          ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500'
                          : active
                            ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100'
                            : 'border-slate-700 bg-slate-800/70 text-slate-100 hover:border-slate-500'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Action theorique
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs text-slate-400">
              Main detectee: <span className="font-semibold text-slate-200">{handKey ?? 'En attente'}</span>
            </p>
            {decisionContext.status !== 'ready' && (
              <p className="mt-2 text-sm text-slate-300">{decisionContext.message}</p>
            )}
            {decisionResult?.status === 'error' && (
              <p className="mt-2 text-sm text-amber-300">{decisionResult.message}</p>
            )}
            {decisionResult?.status === 'ok' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-300">
                  Spot: {decisionResult.scenarioLabel} - {effectiveBb} BB
                </p>
                <span className="rounded-md border border-emerald-400 bg-emerald-500/20 px-2 py-1 text-sm font-bold text-emerald-100">
                  {decisionResult.actionLabel}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  {decisionResult.source}
                </span>
              </div>
            )}
          </div>
        </section>
    </div>
  )
}




