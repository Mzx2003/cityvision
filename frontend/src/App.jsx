import { useEffect, useMemo, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";

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

const AUTH_STORAGE_KEY = "cityvision-auth-session";
const DEFAULT_RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

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
  const [session, setSession] = useState(() => getStoredSession());

  const handleLoginSuccess = (sessionPayload) => {
    setStoredSession(sessionPayload);
    setSession(sessionPayload);
  };

  const handleLogout = async () => {
    const token = session?.token;
    clearStoredSession();
    setSession(null);

    if (!token) {
      return;
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(token)
      });
    } catch {
      // Ignore network errors on logout and keep user signed out locally.
    }
  };

  if (!session) {
    return (
      <main className="auth-shell">
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

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
            <p>Signed in as {session.username}</p>
          </div>
          <div className="header-actions">
            <span className="status-pill">System Online</span>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<HomePage />} />
            <Route
              path="/demo"
              element={<DemoPage sessionToken={session.token} onUnauthorized={handleLogout} />}
            />
            <Route
              path="/dashboard"
              element={<DashboardPage sessionToken={session.token} onUnauthorized={handleLogout} />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLoginSuccess }) {
  const recaptchaRef = useRef(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || DEFAULT_RECAPTCHA_SITE_KEY;
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("CityVision@123");
  const [captchaToken, setCaptchaToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please verify CAPTCHA before logging in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          captchaToken
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(payload.message ?? "Login failed.");
        setCaptchaToken("");
        recaptchaRef.current?.reset();
        return;
      }

      onLoginSuccess({
        token: payload.token,
        username: payload.username,
        expiresAt: payload.expiresAt
      });
    } catch {
      setErrorMessage("Unable to reach server. Please try again.");
      recaptchaRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-card">
      <h1>CityVision Secure Login</h1>
      <p>Complete CAPTCHA verification to prevent automated login attempts.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        <div className="captcha-box">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={(token) => setCaptchaToken(token ?? "")}
            onExpired={() => setCaptchaToken("")}
          />
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Login"}
        </button>
      </form>

      <p className="hint-text">
        Demo account: <code>admin</code> / <code>CityVision@123</code>
      </p>
    </section>
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

function DemoPage({ sessionToken, onUnauthorized }) {
  const [boxes, setBoxes] = useState([]);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const loadViolations = async () => {
      try {
        const response = await fetch("/api/violations", {
          headers: getAuthHeaders(sessionToken)
        });

        if (response.status === 401) {
          onUnauthorized();
          return;
        }

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
  }, [onUnauthorized, sessionToken]);

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
        void postViolation(violation, sessionToken, onUnauthorized);
      }

      timerId = setTimeout(runDetectionLoop, randomInRange(1000, 2000));
    };

    runDetectionLoop();

    return () => {
      mounted = false;
      clearTimeout(timerId);
    };
  }, [onUnauthorized, sessionToken]);

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

async function postViolation(violation, sessionToken, onUnauthorized) {
  try {
    const response = await fetch("/api/violations", {
      method: "POST",
      headers: {
        ...getAuthHeaders(sessionToken),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(violation)
    });

    if (response.status === 401) {
      onUnauthorized();
    }
  } catch {
    // Network issues are tolerated in demo mode.
  }
}

function DashboardPage({ sessionToken, onUnauthorized }) {
  const [violations, setViolations] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    let intervalId;
    let active = true;

    const syncData = async () => {
      try {
        const [healthResponse, violationsResponse, failedLoginsResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/violations", { headers: getAuthHeaders(sessionToken) }),
          fetch("/api/security/failed-logins", { headers: getAuthHeaders(sessionToken) })
        ]);

        if (violationsResponse.status === 401 || failedLoginsResponse.status === 401) {
          onUnauthorized();
          return;
        }

        if (!active) {
          return;
        }

        setApiHealthy(healthResponse.ok);

        if (violationsResponse.ok) {
          const violationData = await violationsResponse.json();
          setViolations(Array.isArray(violationData) ? violationData : []);
        }

        if (failedLoginsResponse.ok) {
          const failedLoginData = await failedLoginsResponse.json();
          setFailedLogins(Array.isArray(failedLoginData) ? failedLoginData : []);
        }
      } catch {
        if (active) {
          setApiHealthy(false);
        }
      }
    };

    void syncData();
    intervalId = setInterval(() => {
      void syncData();
    }, 4000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [onUnauthorized, sessionToken]);

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

      <div className="card">
        <h3>Security Monitoring</h3>
        <p>Failed login attempts logged by backend: {failedLogins.length}</p>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Reason</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {failedLogins.length === 0 ? (
              <tr>
                <td colSpan="4">No failed login attempts recorded.</td>
              </tr>
            ) : (
              failedLogins.slice(0, 8).map((item, index) => (
                <tr key={`${item.timestamp}-${index}`}>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>{item.username}</td>
                  <td>{item.reason}</td>
                  <td>{item.clientIp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

function getAuthHeaders(token) {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

function getStoredSession() {
  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      typeof parsedValue.token !== "string" ||
      typeof parsedValue.username !== "string" ||
      typeof parsedValue.expiresAt !== "string"
    ) {
      return null;
    }

    if (Date.parse(parsedValue.expiresAt) <= Date.now()) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function setStoredSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export default App;
