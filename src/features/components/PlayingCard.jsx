const SUIT_META = {
  spades: { symbol: '♠', colorClass: 'text-slate-900' },
  hearts: { symbol: '♥', colorClass: 'text-red-400' },
  diamonds: { symbol: '♦', colorClass: 'text-red-400' },
  clubs: { symbol: '♣', colorClass: 'text-slate-900' },
}

export default function PlayingCard({ card, compact = false }) {
  const meta = SUIT_META[card?.suit] ?? SUIT_META.spades
  const sizeClass = compact ? 'h-20 w-14 text-sm' : 'h-24 w-16 text-base'

  return (
    <div className={`relative rounded-lg border border-slate-300/50 bg-slate-50/95 p-1 shadow ${sizeClass}`}>
      <div className={`text-left font-bold leading-none ${meta.colorClass}`}>
        <div>{card?.rank ?? '?'}</div>
        <div>{meta.symbol}</div>
      </div>
      <div className={`absolute bottom-1 right-1 text-right font-bold leading-none ${meta.colorClass}`}>
        <div>{card?.rank ?? '?'}</div>
        <div>{meta.symbol}</div>
      </div>
    </div>
  )
}
