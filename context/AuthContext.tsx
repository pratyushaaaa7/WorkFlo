import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id:string
  _id: string;
  username: string;
  role: string;
  fullName: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUser: () => Promise<User | null>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        console.log("Stored token:", storedToken);
        console.log("Stored user:", storedUser);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
        setIsAuthenticated(!!storedToken);
      } catch (err) {
        console.error("Error loading auth:", err);
      }
    };
    loadAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getToken = async (): Promise<string | null> => {
    // Always return a promise
    return token;
  };

  const getUser = async (): Promise<User | null> => {
    return user;
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, login, logout, getToken, getUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to safely access AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
