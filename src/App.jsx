import './App.css';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import Navbar from './components/NavBar';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WatchlistPage from './pages/WatchlistPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
      <Navbar />
    </>
  );
}

export default App;
