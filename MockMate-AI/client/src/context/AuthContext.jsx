import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getStoredToken());

  useEffect(() => {
    authService.setAuthToken(token);
  }, [token]);

  const login = async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    setToken(data.token);
    authService.persistAuth(data);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    setToken(data.token);
    authService.persistAuth(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
