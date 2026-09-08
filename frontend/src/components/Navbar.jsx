import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/categories";

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
    <header className="site-header">
      <div className="nav-shell">
        <div className="nav-main-row">
          <Link to="/" className="brand">
            <span className="brand-mark">CC</span>
            <span className="brand-copy">
              <strong>Campus</strong>
              <span>Connect</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="nav-search">
            <span className="nav-search-icon">⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, notes, professors..."
              aria-label="Search Campus Connect"
            />
          </form>

          <div className="nav-actions">
            {user ? (
              <>
                <Link to="/create" className="nav-new-post">
                  <span>＋</span> New Post
                </Link>
                <div className="nav-profile" title={user.username}>
                  <span className="nav-avatar">{initials(user.username)}</span>
                  <button onClick={handleLogout} className="nav-logout">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-login">
                  Login
                </Link>
                <Link to="/register" className="nav-new-post">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="nav-secondary" aria-label="Primary navigation">
          <NavLink to="/" end>
            Feed
          </NavLink>
          <NavLink to="/search">Search</NavLink>
          {user && <NavLink to="/assistant">Ask AI</NavLink>}
        </nav>
      </div>
    </header>
  );
}
