import StatCard from '../components/StatCard.jsx'

const cameras = [
  {
    id: 'CAM-102',
    name: 'Downtown East',
    location: '5th Ave & Pine',
    status: 'Online',
    lastPing: '4s ago',
    resolution: '4K',
    fps: '60fps',
  },
  {
    id: 'CAM-107',
    name: 'Harbor Bridge',
    location: 'Dock St & 12th',
    status: 'Online',
    lastPing: '9s ago',
    resolution: '4K',
    fps: '30fps',
  },
  {
    id: 'CAM-110',
    name: 'Midtown Loop',
    location: 'Broadway & 18th',
    status: 'Maintenance',
    lastPing: '6m ago',
    resolution: '1080p',
    fps: '30fps',
  },
  {
    id: 'CAM-114',
    name: 'Civic Center',
    location: 'Market St & 3rd',
    status: 'Online',
    lastPing: '12s ago',
    resolution: '4K',
    fps: '60fps',
  },
  {
    id: 'CAM-118',
    name: 'Industrial West',
    location: 'Logistics Rd & 7th',
    status: 'Offline',
    lastPing: '27m ago',
    resolution: '1080p',
    fps: '30fps',
  },
  {
    id: 'CAM-121',
    name: 'Uptown North',
    location: 'Summit Ave & 22nd',
    status: 'Online',
    lastPing: '21s ago',
    resolution: '4K',
    fps: '60fps',
  },
]

const statusStyles = {
  Online: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  Offline: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
  Maintenance: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
}

export default function Cameras() {
  const total = cameras.length
  const online = cameras.filter((cam) => cam.status === 'Online').length
  const offline = cameras.filter((cam) => cam.status === 'Offline').length

  const stats = [
    {
      title: 'Total cameras',
      value: total.toString(),
      change: 'Metro coverage',
      footnote: 'Priority corridors and arterial streets.',
      accent: 'emerald',
    },
    {
      title: 'Online now',
      value: online.toString(),
      change: 'Stable',
      footnote: 'Latency under 200ms on average.',
      accent: 'sky',
    },
    {
      title: 'Offline',
      value: offline.toString(),
      change: 'Attention',
      footnote: 'Field technician dispatched.',
      accent: 'amber',
    },
  ]

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Cameras
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Camera network health
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Monitor coverage, uptime, and maintenance status across the CityVision
          network.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {cam.id}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {cam.name}
                </p>
                <p className="text-sm text-slate-400">{cam.location}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${statusStyles[cam.status]}`}
              >
                {cam.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Last ping
                </p>
                <p className="mt-1 text-slate-200">{cam.lastPing}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Resolution
                </p>
                <p className="mt-1 text-slate-200">{cam.resolution}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Frame rate
                </p>
                <p className="mt-1 text-slate-200">{cam.fps}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Health
                </p>
                <p className="mt-1 text-slate-200">
                  {cam.status === 'Online' ? 'Nominal' : 'Degraded'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
