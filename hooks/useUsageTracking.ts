import { usePathname, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";

export const useUsageTracking = () => {
  const { isAuthenticated, token } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();

  // Session tracking refs
  const sessionStartTime = useRef<number>(Date.now());
  const appState = useRef(AppState.currentState);

  // Screen tracking refs
  const currentScreenStartTime = useRef<number>(Date.now());
  const previousPathname = useRef<string>(pathname);

  // Auth state refs for cleanup logic
  const authRef = useRef({ isAuthenticated, token, pathname });
  useEffect(() => {
    authRef.current = { isAuthenticated, token, pathname };
  }, [isAuthenticated, token, pathname]);

  // Function to send session duration
  const sendSessionDuration = async (durationMs: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;
    try {
      const durationSeconds = Math.round(durationMs / 1000);
      console.log(
        `[UsageTracking] Sending session duration: ${durationSeconds}s`,
      );

      // Potential backend call
      /*
      await api.post('/usage/session', {
        duration: durationSeconds,
        startTime: new Date(sessionStartTime.current).toISOString(),
        endTime: new Date().toISOString(),
      }, {
        headers: { Authorization: `Bearer ${authRef.current.token}` }
      });
      */
    } catch (error) {
      console.error("[UsageTracking] Error sending session duration:", error);
    }
  };

  // Function to send screen time
  const sendScreenTime = async (screenName: string, durationMs: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;
    try {
      const durationSeconds = Math.round(durationMs / 1000);
      if (durationSeconds < 1) return; // Ignore very short views

      console.log(
        `[UsageTracking] Screen: ${screenName}, Time Spent: ${durationSeconds}s`,
      );

      // Potential backend call
      /*
      await api.post('/usage/activity', {
        screenName,
        duration: durationSeconds,
        timestamp: new Date().toISOString(),
      }, {
        headers: { Authorization: `Bearer ${authRef.current.token}` }
      });
      */
    } catch (error) {
      console.error("[UsageTracking] Error sending screen time:", error);
    }
  };

  // 1. AppState Listener for Session Tracking
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - send session duration so far
        const elapsed = Date.now() - sessionStartTime.current;
        sendSessionDuration(elapsed);

        // Also send current screen time
        const screenElapsed = Date.now() - currentScreenStartTime.current;
        sendScreenTime(authRef.current.pathname, screenElapsed);
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App returned to foreground - reset timers
        sessionStartTime.current = Date.now();
        currentScreenStartTime.current = Date.now();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // 2. Navigation Listener for Screen Tracking
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      // User switched screens
      const elapsed = Date.now() - currentScreenStartTime.current;
      sendScreenTime(previousPathname.current, elapsed);

      // Reset for the new screen
      previousPathname.current = pathname;
      currentScreenStartTime.current = Date.now();
    }
  }, [pathname]);

  // 3. Cleanup on logout or unmount
  useEffect(() => {
    return () => {
      if (authRef.current.isAuthenticated) {
        const elapsed = Date.now() - sessionStartTime.current;
        sendSessionDuration(elapsed);

        const screenElapsed = Date.now() - currentScreenStartTime.current;
        sendScreenTime(authRef.current.pathname, screenElapsed);
      }
    };
  }, []);
};
