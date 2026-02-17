import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../state/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("operator");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? "/home";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(username, password);
      signIn(response.token, response.username);
      navigate(destination, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card card">
        <h1>CityVision Login</h1>
        <p>Fake authentication is enabled for this demo. Any credentials are accepted.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="operator" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
