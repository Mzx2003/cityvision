import { useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'

const cameraPool = [
  'Downtown-01',
  'Midtown-03',
  'Harbor-07',
  'Industrial-12',
  'Uptown-08',
  'Civic-04',
]

const violationPool = [
  'Speeding',
  'Red light',
  'Illegal turn',
  'Crosswalk blocking',
  'Bus lane',
]

const statusPool = ['Queued', 'Review', 'Confirmed']

const initialDetections = [
  {
    id: 'CV-84021',
    timestamp: 'Feb 09, 10:42 AM',
    camera: 'Downtown-01',
    violation: 'Speeding',
    confidence: 97.8,
    status: 'Confirmed',
  },
  {
    id: 'CV-84018',
    timestamp: 'Feb 09, 10:39 AM',
    camera: 'Harbor-07',
    violation: 'Red light',
    confidence: 94.2,
    status: 'Review',
  },
  {
    id: 'CV-84015',
    timestamp: 'Feb 09, 10:32 AM',
    camera: 'Midtown-03',
    violation: 'Illegal turn',
    confidence: 92.4,
    status: 'Queued',
  },
  {
    id: 'CV-84012',
    timestamp: 'Feb 09, 10:25 AM',
    camera: 'Civic-04',
    violation: 'Bus lane',
    confidence: 96.1,
    status: 'Confirmed',
  },
]

const statusStyles = {
  Confirmed: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  Review: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
  Queued: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
}

const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

const makeDetection = () => {
  const now = new Date()
  return {
    id: `CV-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    camera: randomItem(cameraPool),
    violation: randomItem(violationPool),
    confidence: Number((92 + Math.random() * 7).toFixed(1)),
    status: randomItem(statusPool),
  }
}

export default function Dashboard() {
  const [detections, setDetections] = useState(initialDetections)

  const stats = useMemo(() => {
    const confirmed = detections.filter((item) => item.status === 'Confirmed')
    const open = detections.filter((item) => item.status !== 'Confirmed')
    const total = detections.length
    const avgConfidence = total
      ? detections.reduce((sum, item) => sum + item.confidence, 0) / total
      : 0

    return [
      {
        title: 'Active cameras',
        value: '24',
        change: '+2 this week',
        footnote: 'All priority corridors are online.',
        accent: 'emerald',
      },
      {
        title: 'Alerts today',
        value: total.toString(),
        change: 'Live feed',
        footnote: `${open.length} awaiting confirmation.`,
        accent: 'sky',
      },
      {
        title: 'Confirmed',
        value: confirmed.length.toString(),
        change: total
          ? `${Math.round((confirmed.length / total) * 100)}% accuracy`
          : 'No data',
        footnote: 'Validated cases ready for export.',
        accent: 'amber',
      },
      {
        title: 'Avg confidence',
        value: `${avgConfidence.toFixed(1)}%`,
        change: 'Model stable',
        footnote: 'Compared to rolling 7-day baseline.',
        accent: 'violet',
      },
    ]
  }, [detections])

  const handleSimulate = () => {
    setDetections((prev) => [makeDetection(), ...prev].slice(0, 6))
  }

  const handleReset = () => {
    setDetections(initialDetections)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Real-time violation monitoring
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Streamed alerts are synthesized from camera inference and staged for
            enforcement review.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSimulate}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-glow transition hover:bg-emerald-400"
          >
            Simulate detection
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Reset feed
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Recent detections</p>
            <p className="text-xs text-slate-400">
              Updated every 30 seconds in production.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live feed connected
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="pb-3">ID</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Camera</th>
                <th className="pb-3">Violation</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {detections.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="py-3 font-semibold text-white">{item.id}</td>
                  <td className="py-3 text-slate-300">{item.timestamp}</td>
                  <td className="py-3">{item.camera}</td>
                  <td className="py-3">{item.violation}</td>
                  <td className="py-3">{item.confidence.toFixed(1)}%</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6">
          <p className="text-sm font-semibold text-white">System insights</p>
          <p className="mt-2 text-sm text-slate-300">
            AI prioritization is calibrated for downtown congestion zones,
            reducing false positives by 18% compared to last month.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'High severity', value: '38', detail: 'Priority lane' },
              { label: 'Automated dispatch', value: '92%', detail: 'On track' },
              { label: 'Evidence ready', value: '114', detail: 'Last 24h' },
              { label: 'Pending review', value: '16', detail: 'Queue stable' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {item.value}
                </p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-900/80 p-6">
          <p className="text-sm font-semibold text-white">Model status</p>
          <p className="mt-2 text-sm text-slate-300">
            Edge models are synchronized and performing within expected ranges.
          </p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Inference latency', value: '180ms', tone: 'emerald' },
              { label: 'Upload throughput', value: '94%', tone: 'sky' },
              { label: 'Storage buffer', value: '28h', tone: 'amber' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span className="text-slate-200">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${
                      item.tone === 'emerald'
                        ? 'w-4/5 bg-emerald-400'
                        : item.tone === 'sky'
                          ? 'w-3/4 bg-sky-400'
                          : 'w-2/3 bg-amber-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
