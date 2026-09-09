import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/categories";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="nav-shell">
        <div className="nav-main-row">
          <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-mark">CC</span>
            <span className="brand-copy">
              <strong>Campus</strong>
              <span>Connect</span>
            </span>
          </Link>

          <nav className="nav-links-desktop" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Feed
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Search
            </NavLink>
            {user && (
              <NavLink to="/assistant" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                ✦ Campus AI
              </NavLink>
            )}
          </nav>

          <form onSubmit={handleSearch} className="nav-search">
            <span className="nav-search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, notes, professors…"
              aria-label="Search Campus Connect"
            />
          </form>

          <div className="nav-actions">
            {user ? (
              <>
                <Link to="/create" className="nav-new-post">
                  <span>＋</span> New Post
                </Link>

                <div className="nav-user-chip" title={`${user.username} (${user.branch || 'Student'})`}>
                  <span className="nav-user-avatar">{initials(user.username)}</span>
                  <span className="nav-username">{user.username}</span>
                  <button onClick={handleLogout} className="nav-logout-btn" title="Log out">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Login
                </Link>
                <Link to="/register" className="nav-new-post">
                  Register
                </Link>
              </>
            )}

            <button
              className="mobile-nav-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav className="mobile-nav-drawer" aria-label="Mobile navigation">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Feed
            </NavLink>
            <NavLink
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Search
            </NavLink>
            {user && (
              <NavLink
                to="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                ✦ Campus AI
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/create"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                ＋ Create a post
              </NavLink>
            )}
            {!user ? (
              <div style={{ display: "flex", gap: 10, padding: "8px 14px" }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-accent">
                  Register
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: "#e57373",
                  padding: "10px 14px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
