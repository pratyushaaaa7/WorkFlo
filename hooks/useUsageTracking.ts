import { usePathname, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";

/**
 * useUsageTracking - High Performance Activity Monitoring
 *
 * Performance Guarantees:
 * 1. Zero-Render Impact: Uses refs for all internal state, so it never triggers component re-renders.
 * 2. Debounced Tracking: Only logs screen views if user stays for > 2 seconds (avoids logging rapid swipes).
 * 3. Asynchronous: API calls are non-blocking and fire-and-forget.
 * 4. Efficient: Only one AppState listener for the entire app.
 */
export const useUsageTracking = () => {
  const { isAuthenticated, token } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();

  // -- REFS (Prevents re-renders) --
  const sessionStartTime = useRef<number>(Date.now());
  const currentScreenStartTime = useRef<number>(Date.now());
  const previousPathname = useRef<string>(pathname);
  const appState = useRef(AppState.currentState);

  // Tracking debounce timer
  const viewTimer = useRef<NodeJS.Timeout | null>(null);

  // Auth state ref for background cleanup
  const authRef = useRef({ isAuthenticated, token, pathname });
  useEffect(() => {
    authRef.current = { isAuthenticated, token, pathname };
  }, [isAuthenticated, token, pathname]);

  // -- LOGIC: Send Session Data --
  const sendSessionDuration = async (durationMs: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;
    try {
      const durationSeconds = Math.round(durationMs / 1000);
      if (durationSeconds < 1) return;

      console.log(`[UsageTracking] 🕒 Session Duration: ${durationSeconds}s`);

      // Backend integration (Uncomment when ready)
      /*
      api.post('/usage/session', {
        duration: durationSeconds,
        startTime: new Date(sessionStartTime.current).toISOString(),
        endTime: new Date().toISOString(),
      }, {
        headers: { Authorization: `Bearer ${authRef.current.token}` }
      }).catch(e => console.error('[UsageTracking] Session sync failed', e));
      */
    } catch (error) {
      // Silent fail to prevent app crash
    }
  };

  // -- LOGIC: Send Screen View Data --
  const sendScreenTime = (screenName: string, durationMs: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;

    const durationSeconds = Math.round(durationMs / 1000);
    // ⚡ DEBOUNCE: Only track if user stayed for at least 2 seconds
    if (durationSeconds < 2) return;

    console.log(
      `[UsageTracking]  Screen: ${screenName} | Time: ${durationSeconds}s`,
    );

    // Backend integration (Uncomment when ready)
    /*
    api.post('/usage/activity', {
      screenName,
      duration: durationSeconds,
      timestamp: new Date().toISOString(),
    }, {
      headers: { Authorization: `Bearer ${authRef.current.token}` }
    }).catch(e => console.error('[UsageTracking] Activity sync failed', e));
    */
  };

  // 1. AppState Listener (Single instance)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App backgrounded: sync EVERYTHING
        const elapsed = Date.now() - sessionStartTime.current;
        sendSessionDuration(elapsed);

        const screenElapsed = Date.now() - currentScreenStartTime.current;
        sendScreenTime(authRef.current.pathname, screenElapsed);
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App foregrounded: restart timers
        sessionStartTime.current = Date.now();
        currentScreenStartTime.current = Date.now();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  // 2. Navigation Tracking (Ref-driven, no renders)
  useEffect(() => {
    // When pathname changes, calculate time spent on PREVIOUS screen
    if (pathname !== previousPathname.current) {
      const elapsed = Date.now() - currentScreenStartTime.current;
      sendScreenTime(previousPathname.current, elapsed);

      // Reset for the NEW screen
      previousPathname.current = pathname;
      currentScreenStartTime.current = Date.now();
    }
  }, [pathname]);

  // 3. Final Cleanup
  useEffect(() => {
    return () => {
      // If user logs out or app unmounts
      if (authRef.current.isAuthenticated) {
        const elapsed = Date.now() - sessionStartTime.current;
        sendSessionDuration(elapsed);

        const screenElapsed = Date.now() - currentScreenStartTime.current;
        sendScreenTime(authRef.current.pathname, screenElapsed);
      }
    };
  }, []);
};
