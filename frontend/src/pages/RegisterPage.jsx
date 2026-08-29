import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    branch: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await client.post("/users", formData);

      const loginResponse = await client.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      login(loginResponse.data.user, loginResponse.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ paddingTop: 40 }}>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <h2 style={{ marginBottom: 4 }}>Join Campus Connect</h2>
        <p className="page-subtext" style={{ marginBottom: 24 }}>
          Create an account to post, vote, and ask the AI assistant.
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
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
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
            />
          </div>

          <div className="field">
            <label>Branch</label>
            <input
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
            />
          </div>

          <div className="field">
            <label>Year</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
            >
              <option value="">Select year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 14, color: "var(--ink-soft)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--gold-dark)", fontWeight: 600 }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
