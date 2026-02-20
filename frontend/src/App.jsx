import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/demo", label: "Demo" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/settings", label: "Settings" }
];

const VIOLATION_TYPES = [
  "Red Light Jump",
  "Wrong Lane",
  "No Helmet",
  "Over Speed",
  "Illegal Parking"
];

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateBoxes() {
  const count = Math.floor(randomInRange(1, 4));
  return Array.from({ length: count }, () => {
    const width = randomInRange(12, 28);
    const height = randomInRange(12, 24);
    return {
      id: crypto.randomUUID(),
      left: randomInRange(0, 100 - width),
      top: randomInRange(0, 100 - height),
      width,
      height
    };
  });
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>CityVision</h1>
        <p>Traffic Violation Detection</p>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="top-header">
          <div>
            <strong>CityVision Control Panel</strong>
            <p>Real-time demo workspace</p>
          </div>
          <span className="status-pill">System Online</span>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <section className="stack">
      <div className="hero card">
        <h2>CityVision - Real-Time Traffic Violation Detection System</h2>
        <p>
          Smart city surveillance demo that detects violations, logs events, and provides a quick
          analytics overview.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" to="/demo">
            Start Demo
          </Link>
          <Link className="btn btn-secondary" to="/dashboard">
            View Dashboard
          </Link>
        </div>
      </div>

      <div className="three-col">
        <article className="card">
          <h3>Real-time Detection</h3>
          <p>Simulated detection boxes run continuously over live traffic footage.</p>
        </article>
        <article className="card">
          <h3>Violation Logging</h3>
          <p>Every detected violation is saved through the backend API and shown instantly.</p>
        </article>
        <article className="card">
          <h3>Dashboard Analytics</h3>
          <p>Monitor totals, daily counts, and category trends with a simple visual chart.</p>
        </article>
      </div>

      <div className="card">
        <h3>How it works</h3>
        <div className="three-col">
          <article>
            <h4>1) Capture</h4>
            <p>Traffic video feed is ingested from a camera source.</p>
          </article>
          <article>
            <h4>2) Detect</h4>
            <p>AI logic identifies suspicious behavior and classifies violations.</p>
          </article>
          <article>
            <h4>3) Analyze</h4>
            <p>Violations are logged and summarized for operators and decision makers.</p>
          </article>
        </div>
      </div>

      <footer className="footer">CityVision Demo © {new Date().getFullYear()}</footer>
    </section>
  );
}

function DemoPage() {
  const [boxes, setBoxes] = useState([]);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const loadViolations = async () => {
      try {
        const response = await fetch("/api/violations");
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setViolations(Array.isArray(data) ? data : []);
      } catch {
        // Keep the page interactive even if the API is temporarily unavailable.
      }
    };

    void loadViolations();
  }, []);

  useEffect(() => {
    let timerId;
    let mounted = true;

    const runDetectionLoop = () => {
      if (!mounted) {
        return;
      }

      setBoxes(generateBoxes());

      if (Math.random() < 0.5) {
        const violation = {
          time: new Date().toLocaleTimeString(),
          type: VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)],
          confidence: Number(randomInRange(72, 99).toFixed(2))
        };

        setViolations((previous) => [violation, ...previous]);
        void postViolation(violation);
      }

      timerId = setTimeout(runDetectionLoop, randomInRange(1000, 2000));
    };

    runDetectionLoop();

    return () => {
      mounted = false;
      clearTimeout(timerId);
    };
  }, []);

  return (
    <section className="stack">
      <div className="card">
        <h2>Live Demo Stream</h2>
        <p>Simulated detections are highlighted every 1-2 seconds.</p>
      </div>

      <div className="card">
        <div className="video-stage">
          <video controls autoPlay muted loop src="/sample-traffic.mp4" />
          <div className="detection-layer">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="detection-box"
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`
                }}
              >
                Vehicle
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Violation Log</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 ? (
              <tr>
                <td colSpan="3">No violations yet.</td>
              </tr>
            ) : (
              violations.slice(0, 12).map((violation, index) => (
                <tr key={violation.id ?? `${violation.time}-${index}`}>
                  <td>{violation.time}</td>
                  <td>{violation.type}</td>
                  <td>{violation.confidence}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function postViolation(violation) {
  try {
    await fetch("/api/violations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(violation)
    });
  } catch {
    // Network issues are tolerated in demo mode.
  }
}

function DashboardPage() {
  const [violations, setViolations] = useState([]);
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    let intervalId;

    const syncData = async () => {
      try {
        const [healthResponse, violationsResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/violations")
        ]);

        setApiHealthy(healthResponse.ok);

        if (violationsResponse.ok) {
          const data = await violationsResponse.json();
          setViolations(Array.isArray(data) ? data : []);
        }
      } catch {
        setApiHealthy(false);
      }
    };

    void syncData();
    intervalId = setInterval(() => {
      void syncData();
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return violations.filter((item) => {
      const date = new Date(item.createdAt ?? Date.now());
      return date.toDateString() === today;
    }).length;
  }, [violations]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(VIOLATION_TYPES.map((type) => [type, 0]));

    for (const violation of violations) {
      const label = violation.type;
      if (counts[label] !== undefined) {
        counts[label] += 1;
      } else {
        counts[label] = 1;
      }
    }

    return counts;
  }, [violations]);

  const maxCount = Math.max(...Object.values(typeCounts), 1);

  return (
    <section className="stack">
      <div className="three-col">
        <article className="card stat-card">
          <h3>Total Violations</h3>
          <p>{violations.length}</p>
        </article>
        <article className="card stat-card">
          <h3>Today</h3>
          <p>{todayCount}</p>
        </article>
        <article className="card stat-card">
          <h3>Accuracy</h3>
          <p>94.7%</p>
        </article>
      </div>

      <div className="card">
        <h3>Violation Trend (Placeholder Chart)</h3>
        <p className="chart-caption">
          API status:{" "}
          <span className={apiHealthy ? "online" : "offline"}>
            {apiHealthy ? "Healthy" : "Disconnected"}
          </span>
        </p>
        <div className="chart">
          {Object.entries(typeCounts).map(([type, value]) => (
            <div className="bar-row" key={type}>
              <span>{type}</span>
              <div className="bar-track">
                <div className="bar-value" style={{ width: `${(value / maxCount) * 100}%` }} />
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsPage() {
  const [cameraSource, setCameraSource] = useState("Main-Road-Cam-01");
  const [sensitivity, setSensitivity] = useState(68);
  const [sendAlerts, setSendAlerts] = useState(true);
  const [autoLogging, setAutoLogging] = useState(true);

  return (
    <section className="stack">
      <div className="card">
        <h2>System Settings</h2>
        <p>Configuration placeholders for a production deployment.</p>
      </div>

      <div className="card form-grid">
        <label>
          Camera Source
          <input
            type="text"
            value={cameraSource}
            onChange={(event) => setCameraSource(event.target.value)}
          />
        </label>

        <label>
          Detection Sensitivity ({sensitivity}%)
          <input
            type="range"
            min="1"
            max="100"
            value={sensitivity}
            onChange={(event) => setSensitivity(Number(event.target.value))}
          />
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={sendAlerts}
            onChange={(event) => setSendAlerts(event.target.checked)}
          />
          Enable instant alerts
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={autoLogging}
            onChange={(event) => setAutoLogging(event.target.checked)}
          />
          Auto-save violations
        </label>
      </div>
    </section>
  );
}

export default App;
