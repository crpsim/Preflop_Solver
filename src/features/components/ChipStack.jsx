export default function ChipStack({ bb = 0, compact = false }) {
  const size = compact ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-5 w-6">
        <span className={`absolute left-0 top-2 rounded-full border border-amber-300/70 bg-amber-500/60 ${size}`} />
        <span className={`absolute left-1 top-1 rounded-full border border-amber-300/70 bg-amber-400/70 ${size}`} />
        <span className={`absolute left-2 top-0 rounded-full border border-amber-300/70 bg-amber-300/80 ${size}`} />
      </div>
      <span className="text-[11px] font-semibold text-amber-200">{bb} BB</span>
    </div>
  )
}
