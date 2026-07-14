import './App.css';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import SuggestPage from './pages/SuggestPage';
import Navbar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import WatchlistPage from './pages/WatchlistPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/suggest" element={<SuggestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
      <Navbar />
    </>
  );
}

export default App;
