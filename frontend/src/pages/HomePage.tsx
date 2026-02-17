import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="page">
      <section className="card hero">
        <h1>CityVision Traffic Monitoring Demo</h1>
        <p>
          This demo simulates AI-based traffic analytics with live detections, video overlays, and configurable
          violation settings.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      </section>

      <section className="grid-two">
        <article className="card">
          <h3>What this demo shows</h3>
          <ul>
            <li>Video playback with simulated detection boxes</li>
            <li>Recent detection records with confidence and metadata</li>
            <li>Backend-managed settings for violation rules</li>
          </ul>
        </article>
        <article className="card">
          <h3>Supervisor-ready flow</h3>
          <p>
            Login, move to Dashboard, and watch detections update every few seconds. Then adjust settings and return to
            verify persisted behavior.
          </p>
        </article>
      </section>
    </main>
  );
}
