import './App.css';
import LandingPage from './pages/LandingPage';
import Navbar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import WatchlistPage from './pages/WatchlistPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/search"
        element={
          <Navigate
            to={{ pathname: '/', hash: '#search' }}
            replace
            state={{ scrollTo: 'search' }}
          />
        }
      />
      <Route
        path="/suggest"
        element={
          <Navigate
            to={{ pathname: '/', hash: '#suggest' }}
            replace
            state={{ scrollTo: 'suggest' }}
          />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <AppRoutes />
      <Navbar />
    </>
  );
}

export default App;
