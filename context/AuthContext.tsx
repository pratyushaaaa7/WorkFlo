import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
        setIsAuthenticated(!!storedToken);
      } catch (err) {
        console.error('Error checking token from storage:', err);
      }
    };
    checkToken();
  }, []);

  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem('token', newToken);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getToken = async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (err) {
      console.error('GetToken error:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to safely access AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Optional: Export context if you need it directly
export { AuthContext };
