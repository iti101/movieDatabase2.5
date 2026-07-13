import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'loggedIn';

function readLoggedIn() {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(readLoggedIn);

  function login() {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsLoggedIn(true);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
