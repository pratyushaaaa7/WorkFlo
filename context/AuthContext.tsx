import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
// import { router } from "expo-router";

type User = {
  id: string;
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
  authLoading: boolean; // 👈 ADD THIS
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const authRef = { current: null as any };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // NEW: Loading state so we do not expose wrong auth state
  const [authLoading, setAuthLoading] = useState(true);

  const isTokenExpired = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const loadAuth = async () => {
      console.log("🔄 Loading auth from AsyncStorage...");
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        console.log("📦 Stored Token:", storedToken);
        console.log("📦 Stored User:", storedUser);

        if (storedToken && !isTokenExpired(storedToken)) {
          console.log("✅ Token valid → Restoring session");
          setToken(storedToken);
          setUser(storedUser ? JSON.parse(storedUser) : null);
          setIsAuthenticated(true);
        } else {
          // console.log("⛔ No token OR expired → clearing");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          setIsAuthenticated(false);
          setToken(null);
          setUser(null);
        }
      } finally {
        setAuthLoading(false); // 🔥 VERY IMPORTANT
      }
    };

    loadAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    console.log("🔐 LOGIN TRIGGERED:", { newUser });

    try {
      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      // console.log("💾 Saved token & user to AsyncStorage");

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("❌ Login error:", err);
    }
  };

   // LOGOUT – FIXED WITH useCallback()
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    authRef.current = {
      logout,
    };
  }, [logout]);

  // const getToken = async (): Promise<string | null> => {
  //   console.log("🔍 getToken:", token);
  //   return token;
  // };

  // const getUser = async (): Promise<User | null> => {
  //   console.log("🔍 getUser:", user);
  //   return user;
  // };

  const getToken = async () => token;
  const getUser = async () => user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        logout,
        getToken,
        getUser,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
