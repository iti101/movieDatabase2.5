import { createContext, useContext, useState } from 'react';
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  isTokenExpired,
  login as apiLogin,
  register as apiRegister,
} from '../services/noviApi';

const AuthContext = createContext(null);

function readInitialUser() {
  const token = getStoredToken();
  const storedUser = getStoredUser();

  if (!token || isTokenExpired(token) || !storedUser) {
    clearAuthStorage();
    return null;
  }

  return storedUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);

  async function login(email, password) {
    const { user: nextUser } = await apiLogin(email, password);
    setUser(nextUser);
    return nextUser;
  }

  async function register(email, password) {
    return apiRegister(email, password);
  }

  function logout() {
    clearAuthStorage();
    setUser(null);
  }

  const value = {
    user,
    isLoggedIn: Boolean(user),
    authStatus: 'ready',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
