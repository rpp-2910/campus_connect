import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import AssistantPage from './pages/AssistantPage';
import SearchPage from './pages/SearchPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        
        <Route path="/search" element={<SearchPage />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <RegisterPage />}
        />

        <Route path="/posts/:id" element={<PostDetailPage />} />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <AssistantPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}