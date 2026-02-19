import { useMemo } from 'react'
import PlayingCard from './PlayingCard'
import Seat from './Seat'
import { buildActionMap, getCenterPotVisual, handCodeToTwoCards } from '../pokerVisualUtils'

const centerToneClass = (tone) => {
  if (tone === 'danger') return 'border-rose-500/70 bg-rose-500/20 text-rose-100'
  if (tone === 'raise') return 'border-cyan-500/70 bg-cyan-500/20 text-cyan-100'
  if (tone === 'passive') return 'border-emerald-500/70 bg-emerald-500/20 text-emerald-100'
  return 'border-slate-600 bg-slate-800/80 text-slate-200'
}

export default function PokerTableQuestion({ question }) {
  const actionMap = useMemo(() => buildActionMap(question), [question])
  const centerPot = useMemo(() => getCenterPotVisual(question), [question])
  const cards = useMemo(() => handCodeToTwoCards(question?.hand), [question?.hand])

  const isHu = question?.format === 'HU'
  const isHeroCompact = false

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-100">Quelle est la meilleure action ?</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-100">
            {question?.effectiveBb ?? '--'}bb
          </span>
          <span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-100">
            {question?.format ?? '--'}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-2 sm:p-3">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-[400px]">
          <div className="absolute inset-4 rounded-full border border-emerald-500/30 bg-gradient-to-b from-emerald-900/50 via-emerald-950/40 to-slate-950/40" />

          <div className={`absolute left-1/2 -translate-x-1/2 ${isHu ? 'top-1' : 'top-0'} w-[34%] min-w-[96px]`}>
            <Seat
              position={isHu ? 'BTN/SB' : 'BTN'}
              stackBb={question?.effectiveBb}
              action={actionMap[isHu ? 'BTN/SB' : 'BTN']}
              isHero={question?.heroPosition === (isHu ? 'BTN/SB' : 'BTN')}
              compact={isHeroCompact}
            />
          </div>

          {!isHu && (
            <>
              <div className="absolute bottom-1 left-0 w-[35%] min-w-[102px]">
                <Seat
                  position="SB"
                  stackBb={question?.effectiveBb}
                  action={actionMap.SB}
                  isHero={question?.heroPosition === 'SB'}
                  compact={isHeroCompact}
                />
              </div>

              <div className="absolute bottom-1 right-0 w-[35%] min-w-[102px]">
                <Seat
                  position="BB"
                  stackBb={question?.effectiveBb}
                  action={actionMap.BB}
                  isHero={question?.heroPosition === 'BB'}
                  compact={isHeroCompact}
                />
              </div>
            </>
          )}

          {isHu && (
            <div className="absolute bottom-1 left-1/2 w-[36%] min-w-[108px] -translate-x-1/2">
              <Seat
                position="BB"
                stackBb={question?.effectiveBb}
                action={actionMap.BB}
                isHero={question?.heroPosition === 'BB'}
                compact={isHeroCompact}
              />
            </div>
          )}

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`rounded-full border px-3 py-1 text-[11px] font-bold ${centerToneClass(centerPot.tone)}`}>
              {centerPot.label}
            </div>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Tes cartes</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {cards.length === 0 && (
              <span className="text-xs text-slate-400">Main indisponible</span>
            )}
            {cards.map((card, index) => (
              <PlayingCard key={`${card.rank}-${card.suit}-${index}`} card={card} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
