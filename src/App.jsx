import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Cameras from './pages/Cameras.jsx'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Cameras', to: '/cameras' },
]

const navClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-slate-800 text-white shadow-sm'
      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
  ].join(' ')

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/10 via-slate-950/5 to-transparent" />
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200 shadow-glow">
              CV
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                CityVision
              </p>
              <p className="text-xs text-slate-400">
                Real-Time Traffic Violation Detection
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Monitoring active
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 px-6 py-3 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass} end>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cameras" element={<Cameras />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800/70 bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>CityVision demo environment • No live data is collected.</p>
          <p>Last sync: {new Date().toLocaleString()}</p>
        </div>
      </footer>
    </div>
  )
}

export default App
