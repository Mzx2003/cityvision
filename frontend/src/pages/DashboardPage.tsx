import { useEffect, useState } from "react";
import { getDetections } from "../api";
import VideoDetectionPlayer from "../components/VideoDetectionPlayer";
import { useAuth } from "../state/AuthContext";
import type { Detection } from "../types";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString();
}

export default function DashboardPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, signOut } = useAuth();

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;

    const fetchDetections = async () => {
      try {
        const nextDetections = await getDetections(token);
        if (active) {
          setDetections(nextDetections);
          setError(null);
          setLoading(false);
        }
      } catch (fetchError) {
        if (active) {
          const message = fetchError instanceof Error ? fetchError.message : "Failed to load detections";
          setError(message);
          setLoading(false);
          if (message.toLowerCase().includes("unauthorized")) {
            signOut();
          }
        }
      }
    };

    fetchDetections();
    const timer = window.setInterval(fetchDetections, 2_500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token, signOut]);

  return (
    <main className="page">
      <section className="grid-two dashboard-grid">
        <VideoDetectionPlayer detections={detections} />
        <article className="card stats-card">
          <h3>Live Summary</h3>
          <div className="metric-list">
            <div className="metric">
              <span>Total detections (latest batch)</span>
              <strong>{detections.length}</strong>
            </div>
            <div className="metric">
              <span>High confidence (&gt; 90%)</span>
              <strong>{detections.filter((detection) => detection.confidence >= 0.9).length}</strong>
            </div>
            <div className="metric">
              <span>Potential violations</span>
              <strong>{detections.filter((detection) => detection.violationType !== "None").length}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <h3>Recent Detections</h3>
        {loading && <p>Loading detections...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Confidence</th>
                  <th>Lane</th>
                  <th>Speed (km/h)</th>
                  <th>Violation Type</th>
                </tr>
              </thead>
              <tbody>
                {detections.slice(0, 12).map((detection) => (
                  <tr key={detection.id}>
                    <td>{formatTime(detection.time)}</td>
                    <td>{detection.class}</td>
                    <td>{Math.round(detection.confidence * 100)}%</td>
                    <td>{detection.lane}</td>
                    <td>{detection.speed}</td>
                    <td>{detection.violationType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
