import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api";
import { useAuth } from "../state/AuthContext";
import type { Settings } from "../types";

const defaultSettings: Settings = {
  enableSpeedViolation: true,
  enableLaneViolation: true
};

export default function SettingsPage() {
  const { token, signOut } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await getSettings(token);
        setSettings(response);
        setError(null);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load settings";
        setError(message);
        if (message.toLowerCase().includes("unauthorized")) {
          signOut();
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token, signOut]);

  const save = async () => {
    if (!token) {
      return;
    }

    setSaveStatus("Saving...");
    try {
      const updated = await updateSettings(token, settings);
      setSettings(updated);
      setSaveStatus("Settings saved.");
      setError(null);
    } catch (saveError) {
      setSaveStatus(null);
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    }
  };

  return (
    <main className="page">
      <section className="card settings-card">
        <h1>Detection Settings</h1>
        <p>Use these toggles to simulate enabling or disabling violation checks.</p>

        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <>
            <label className="switch-row">
              <span>Enable speed violation</span>
              <input
                type="checkbox"
                checked={settings.enableSpeedViolation}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    enableSpeedViolation: event.target.checked
                  }))
                }
              />
            </label>

            <label className="switch-row">
              <span>Enable lane violation</span>
              <input
                type="checkbox"
                checked={settings.enableLaneViolation}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    enableLaneViolation: event.target.checked
                  }))
                }
              />
            </label>

            {error && <p className="error-text">{error}</p>}
            {saveStatus && <p className="success-text">{saveStatus}</p>}

            <button className="btn btn-primary" onClick={save}>
              Save Settings
            </button>
          </>
        )}
      </section>
    </main>
  );
}
