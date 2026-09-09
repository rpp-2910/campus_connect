import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import client from "../api/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await client.post("/login", { email, password });
      login(response.data.user, response.data.token);
      toast.success(`Welcome back, ${response.data.user.username}!`);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="card" style={{ padding: "36px 32px", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--ink)",
            color: "var(--gold)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          CC
        </div>

        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p className="page-subtext" style={{ marginBottom: 24, fontSize: 13.5 }}>
          Log in to join discussions, share resources, and vote.
        </p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>College Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. sam@gmail.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 8, padding: "12px 0" }}
          >
            {loading ? "Logging in…" : "Log In to Campus Connect"}
          </button>
        </form>

        <p style={{ marginTop: 22, fontSize: 13.5, color: "var(--ink-soft)" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--gold-dark)", fontWeight: 700 }}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
