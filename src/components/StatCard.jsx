const accentStyles = {
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-100',
}

export default function StatCard({ title, value, change, footnote, accent = 'sky' }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-white">{value}</p>
        {change && (
          <span
            className={`rounded-full border px-2 py-1 text-xs ${accentStyles[accent]}`}
          >
            {change}
          </span>
        )}
      </div>
      {footnote && <p className="mt-3 text-xs text-slate-500">{footnote}</p>}
    </div>
  )
}
