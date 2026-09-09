import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import client from "../api/client";

const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other / Applied Sciences",
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    branch: "Computer Engineering",
    year: "1",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await client.post("/users", formData);

      // Immediately log the user in
      const loginResponse = await client.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      login(loginResponse.data.user, loginResponse.data.token);
      toast.success(`Account created! Welcome to Campus Connect, ${formData.username}!`);
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err.response?.data?.error || "Registration failed. Please check your details.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div className="card" style={{ padding: "34px 30px", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--ink)",
            color: "var(--gold)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 14px",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          CC
        </div>

        <h2 style={{ marginBottom: 4 }}>Join Campus Connect</h2>
        <p className="page-subtext" style={{ marginBottom: 22, fontSize: 13.5 }}>
          Create an account to ask questions, share notes, and participate.
        </p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="e.g. aditya_sharma"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label>College Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g. aditya@spit.ac.in"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Branch / Major</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loading}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Academic Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 12, padding: "12px 0" }}
          >
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13.5, color: "var(--ink-soft)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--gold-dark)", fontWeight: 700 }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
