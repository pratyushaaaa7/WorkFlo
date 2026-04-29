import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import api from "../lib/api";
// import { router } from "expo-router";

type User = {
  id?: string;
  _id: string;
  username: string;
  role: string;
  fullName: string;
  employeeCode?: number;
  company?: string;
  designation?: string;
  profileImage?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUser: () => Promise<User | null>;
  authLoading: boolean;
  expoPushToken: string | null;
  setExpoPushToken: (token: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const authRef = { current: null as any };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // NEW: Loading state so we do not expose wrong auth state
  const [authLoading, setAuthLoading] = useState(true);

  // LOGOUT
  const logout = useCallback(async () => {
    // 🔔 Clear push token from server before wiping local auth
    if (token && expoPushToken) {
      console.log("🧹 Removing push token from server...");
      try {
        // We use a manual header because the local token might be about to disappear
        // and we want to ensure this request goes through with the current session.
        await api.patch(
          "/users/notification-preferences",
          { removePushToken: expoPushToken },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        // console.log("✅ Push token removed successfully");
      } catch (err) {
        console.error("❌ Failed to remove push token during logout:", err);
      }
    }

    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, [token, expoPushToken]);

  const isTokenExpired = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return false; // If no exp, assume it doesn't expire
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  };

  const checkTokenExpiration = useCallback(async () => {
    if (token && isTokenExpired(token)) {
      console.log("⏰ Token expired (auto-check) → Logging out");
      await logout();
    }
  }, [token, logout]);

  // Check on App State Change (Foregrounding)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppStateStatus: AppStateStatus) => {
        if (nextAppStateStatus === "active") {
          console.log("📱 App back to foreground → Checking token...");
          checkTokenExpiration();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [checkTokenExpiration]);

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

      console.log("💾 Saved token & user to AsyncStorage", newUser);

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("❌ Login error:", err);
    }
  };

  useEffect(() => {
    authRef.current = {
      logout,
    };
  }, [logout]);

  const getToken = async () => token;
  const getUser = async () => user;

  const updateUser = async (updatedData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        updateUser,
        logout,
        getToken,
        getUser,
        authLoading,
        expoPushToken,
        setExpoPushToken,
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
