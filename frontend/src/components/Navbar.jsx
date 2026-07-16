import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar () {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout ();
    navigate('/login');
  };

  return(
    <nav style = {{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      backgroundColor: '#1a2b4a',
      color: 'white'
    }}>

      <Link to="/" style = {{ color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold'}}>Campus Connect</Link>

      <div style={{ display: 'flex', gap:'16px', alignItems:'center'}}>
        {user ? (
          <>
            <span>Hi, {user.username}</span>
            <Link to="/create" style={{ color: 'white' }}>New Post</Link>
            <Link to="/assistant" style={{ color: 'white' }}>AI Assistant</Link>
            <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white' }}>Login</Link>
            <Link to="/register" style={{ color: 'white' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}