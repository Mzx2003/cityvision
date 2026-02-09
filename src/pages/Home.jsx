import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard.jsx'

const highlights = [
  {
    title: 'Active intersections',
    value: '124',
    change: '+12% coverage',
    footnote: 'City-wide coverage across priority corridors.',
    accent: 'emerald',
  },
  {
    title: 'Violations today',
    value: '1,482',
    change: 'Real-time feed',
    footnote: 'AI-driven filtering reduces noise by 63%.',
    accent: 'sky',
  },
  {
    title: 'Average response',
    value: '12s',
    change: 'On track',
    footnote: 'Automated routing to enforcement partners.',
    accent: 'amber',
  },
]

const capabilities = [
  {
    title: 'Live violation detection',
    description:
      'Monitor red light, speeding, and lane discipline events as they happen.',
  },
  {
    title: 'Evidence-ready snapshots',
    description:
      'Generate annotated clips with plate, speed, and signal timing metadata.',
  },
  {
    title: 'Predictive risk mapping',
    description:
      'Spot emerging hotspots and deploy patrols with higher confidence.',
  },
]

const liveStream = [
  { label: 'Downtown-01', detail: 'Red light violation queued for review' },
  { label: 'Harbor-07', detail: 'Speeding alert confirmed, 72 mph' },
  { label: 'Midtown-03', detail: 'Illegal turn flagged, awaiting validation' },
]

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
            CityVision Demo
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            Real-time traffic violation detection for smarter, safer cities.
          </h1>
          <p className="text-base text-slate-300 md:text-lg">
            CityVision unifies camera feeds, AI inference, and enforcement
            workflows into a single modern dashboard. This demo showcases the
            interface and data flow without requiring a live backend.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-glow transition hover:bg-emerald-400"
            >
              Open dashboard
            </Link>
            <Link
              to="/cameras"
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              View cameras
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Live system feed</p>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
              Streaming
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {liveStream.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-slate-200">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {capabilities.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6"
          >
            <p className="text-lg font-semibold text-white">{item.title}</p>
            <p className="mt-3 text-sm text-slate-300">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Operational view
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Evidence workflows designed for rapid action.
            </h2>
            <p className="mt-4 text-sm text-slate-300">
              Each alert is enriched with timestamped clips, plate recognition,
              and lane context. Enforcement teams can validate, flag, or dismiss
              incidents within seconds.
            </p>
          </div>
          <div className="space-y-4">
            {[
              'Automated evidence packet generation',
              'Priority routing for severe violations',
              'Historical analytics and trend snapshots',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 text-sm text-slate-200"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
