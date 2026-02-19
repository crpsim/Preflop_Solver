import ChipStack from './ChipStack'
import { actionToShort } from '../pokerVisualUtils'

const actionTone = (action) => {
  const normalized = String(action || '').toLowerCase()
  if (!normalized) return 'border-slate-600 bg-slate-700/70 text-slate-200'
  if (normalized.includes('fold')) return 'border-slate-500 bg-slate-700/60 text-slate-200'
  if (normalized.includes('shove') || normalized.includes('all-in') || normalized === 'ai') {
    return 'border-rose-500/70 bg-rose-500/20 text-rose-100'
  }
  if (normalized.includes('open') || normalized.includes('raise') || normalized.includes('3bet') || normalized.includes('iso')) {
    return 'border-cyan-500/70 bg-cyan-500/20 text-cyan-100'
  }
  if (normalized.includes('limp') || normalized.includes('call')) {
    return 'border-emerald-500/70 bg-emerald-500/20 text-emerald-100'
  }
  return 'border-violet-500/70 bg-violet-500/20 text-violet-100'
}

export default function Seat({ position, stackBb, action, isHero = false, compact = false }) {
  return (
    <div
      className={`max-w-full rounded-xl border px-2 py-2 text-center ${
        isHero
          ? 'border-amber-300/80 bg-amber-500/10 shadow-[0_0_0_1px_rgba(252,211,77,0.2)]'
          : 'border-slate-700 bg-slate-900/70'
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-100">
          {position}
        </span>
        {action ? (
          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${actionTone(action)}`}>
            {actionToShort(action)}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex justify-center">
        <ChipStack bb={stackBb} compact={compact} />
      </div>
    </div>
  )
}
