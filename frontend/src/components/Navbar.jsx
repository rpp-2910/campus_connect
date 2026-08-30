import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/categories";

const navLinkStyle = ({ isActive }) => ({
  color: isActive ? "#fff" : "rgba(247,245,239,0.72)",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
  padding: "6px 0",
  borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
  transition: "color 0.15s",
});

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        justifyContent: "center",
        background: "var(--ink)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--gold)",
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            CC
          </span>
          <span
            style={{
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: "-0.01em",
            }}
          >
            Campus Connect
          </span>
        </Link>

        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            maxWidth: 340,
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              outline: "none",
              fontSize: 13.5,
            }}
          />
        </form>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {user ? (
            <>
              <NavLink to="/assistant" style={navLinkStyle}>
                Ask AI
              </NavLink>
              <Link
                to="/create"
                className="btn btn-accent"
                style={{ padding: "7px 14px", fontSize: 13.5 }}
              >
                + New Post
              </Link>
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
                title={user.username}
              >
                <span
                  className="avatar"
                  style={{ width: 28, height: 28, fontSize: 12 }}
                >
                  {initials(user.username)}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(247,245,239,0.72)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" style={navLinkStyle}>
                Login
              </NavLink>
              <Link
                to="/register"
                className="btn btn-accent"
                style={{ padding: "7px 16px", fontSize: 13.5 }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
