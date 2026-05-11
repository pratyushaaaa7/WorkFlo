import api from "@/lib/api";
import moment from "moment";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";

// ─── Idle Detection Constants ─────────────────────────────────────────────
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min without touch → idle
const MAX_HEARTBEAT_DURATION_S = 90; // Cap any single heartbeat at 90s
const HEARTBEAT_INTERVAL_MS = 60_000; // 60s heartbeat

// Module-level interaction timestamp — updated from _layout.tsx touch wrapper
let _lastInteractionTime = Date.now();

/**
 * Call this on every user touch to keep the session "alive".
 * Exported so _layout.tsx can invoke it from a responder wrapper.
 */
export const reportUserInteraction = () => {
  _lastInteractionTime = Date.now();
};

/**
 * Helper: compute the ACTIVE portion of a time window.
 *
 * Given a window [windowStart … now], the user was definitely active at
 * `_lastInteractionTime`.  We consider them active for up to
 * IDLE_THRESHOLD_MS *after* their last touch.
 *
 * activeEnd = min(now, lastInteraction + IDLE_THRESHOLD)
 * activeMs  = max(0, activeEnd - windowStart)
 *
 * This strips out any idle gap that falls inside the window.
 */
const getActiveDurationMs = (windowStartMs: number): number => {
  const now = Date.now();
  const activeEnd = Math.min(now, _lastInteractionTime + IDLE_THRESHOLD_MS);
  return Math.max(0, activeEnd - windowStartMs);
};

/**
 * useUsageTracking - Analytics for App Session and Screen Usage
 * Matches requirements:
 * 1. POST /api/usage/session - Track active time (incremental) and new sessions.
 * 2. POST /api/usage/activity - Track screen usage (total time on screen).
 *
 * Improvements:
 * - Duplicate guard (screenSyncedRef)
 * - Screen Name normalization (/:id)
 * - Idle detection: touch-based inactivity threshold (5 min)
 * - Gap exclusion: idle time is stripped from both session & screen durations
 * - Duration cap: no single heartbeat exceeds 90s
 */
export const useUsageTracking = () => {
  const { isAuthenticated, token } = useAuth();
  const pathname = usePathname();

  // -- REFS --
  // Session tracking
  const lastSessionSyncTime = useRef<number>(Date.now());
  const isNewSessionRef = useRef<boolean>(true);

  // Screen tracking
  const currentScreenStartTime = useRef<number>(Date.now());
  const previousPathname = useRef<string>(pathname);
  const screenSyncedRef = useRef<boolean>(false); // Prevent double logging

  const appState = useRef(AppState.currentState);

  // Auth refs for accessing current state inside async/intervals without deps
  const authRef = useRef({ isAuthenticated, token, pathname });
  useEffect(() => {
    authRef.current = { isAuthenticated, token, pathname };
  }, [isAuthenticated, token, pathname]);

  // ---------------------------------------------------------
  // Helper: Normalize Screen Names
  // ---------------------------------------------------------
  const normalizeScreenName = (path: string) => {
    if (!path) return "Unknown";
    return path
      .split("?")[0] // Remove query params
      .replace(/\/([0-9a-fA-F]{24}|[0-9]+)/g, "/:id"); // Replace IDs (MongoIDs or numbers) with :id
  };

  // ---------------------------------------------------------
  // 1. Session Tracking (Heartbeat + App State)
  // ---------------------------------------------------------

  const sendSessionUpdate = async (manualDuration?: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;

    const now = Date.now();

    let durationMs: number;

    if (manualDuration !== undefined) {
      // Explicit duration (e.g. initial 0-ping) — use as-is
      durationMs = manualDuration;
    } else {
      // Compute only the ACTIVE portion since last sync, excluding idle gaps
      durationMs = getActiveDurationMs(lastSessionSyncTime.current);
      lastSessionSyncTime.current = now;
    }

    // Cap at MAX_HEARTBEAT_DURATION_S
    const durationSeconds = Math.min(
      Math.round(durationMs / 1000),
      MAX_HEARTBEAT_DURATION_S,
    );

    const isNewSession = isNewSessionRef.current;
    const todayStr = moment().format("YYYY-MM-DD");

    // Skip if no time passed and not a new session
    if (durationSeconds <= 0 && !isNewSession) return;

    try {
      // console.log(`[Analytics] 📡 Session: ${durationSeconds}s${isNewSession ? " (New)" : ""}`);

      await api.post(
        "/usage/session",
        {
          duration: durationSeconds,
          isNewSession: isNewSession,
          date: todayStr,
        },
        { headers: { Authorization: `Bearer ${authRef.current.token}` } },
      );

      if (isNewSession) {
        isNewSessionRef.current = false;
      }
    } catch (err) {
      // console.error("[Analytics] Failed to sync session:", err);
    }
  };

  // ---------------------------------------------------------
  // 2. Screen Activity Tracking
  // ---------------------------------------------------------

  const sendScreenActivity = async (screenName: string, rawDurationMs: number) => {
    if (!authRef.current.isAuthenticated || !authRef.current.token) return;

    // GUARD: Prevent duplicate logging for same screen session
    if (screenSyncedRef.current) return;

    // ── Gap exclusion for screen time ──────────────────────
    // Use the active portion of the screen window, not the raw elapsed time.
    // This strips any idle gap where the user wasn't touching the screen.
    const activeDurationMs = getActiveDurationMs(currentScreenStartTime.current);
    const durationMs = Math.min(rawDurationMs, activeDurationMs);

    const durationSeconds = Math.min(
      Math.round(durationMs / 1000),
      MAX_HEARTBEAT_DURATION_S,
    );
    if (durationSeconds < 1) return; // Ignore < 1s views

    // Mark as synced so we don't send again until reset
    screenSyncedRef.current = true;

    try {
      const cleanName = normalizeScreenName(screenName);
      // console.log(`[Analytics] 📱 Screen: ${cleanName} (${durationSeconds}s)`);

      await api.post(
        "/usage/activity",
        {
          screenName: cleanName,
          duration: durationSeconds,
          date: moment().format("YYYY-MM-DD"),
        },
        { headers: { Authorization: `Bearer ${authRef.current.token}` } },
      );
    } catch (err) {
      // console.error("[Analytics] Failed to sync activity:", err);
    }
  };

  // ---------------------------------------------------------
  // 3. Effects & Listeners
  // ---------------------------------------------------------

  // A) Initial App Launch Session Ping (Run once)
  useEffect(() => {
    if (isAuthenticated) {
      sendSessionUpdate(0);
      // Also reset screen synced state on fresh auth mount just in case
      screenSyncedRef.current = false;
    }
  }, [isAuthenticated]);

  // B) Heartbeat Interval (Every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (appState.current === "active") {
        const idle = Date.now() - _lastInteractionTime > IDLE_THRESHOLD_MS;
        if (!idle) {
          sendSessionUpdate();
        } else {
          // Idle — advance the sync clock so we don't bank idle time
          lastSessionSyncTime.current = Date.now();
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // C) App State Changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Active -> Inactive/Background: Sync EVERYTHING
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        sendSessionUpdate();

        const screenElapsed = Date.now() - currentScreenStartTime.current;
        sendScreenActivity(authRef.current.pathname, screenElapsed);
      }

      // Inactive -> Active: Reset timers
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        lastSessionSyncTime.current = Date.now();
        currentScreenStartTime.current = Date.now();
        _lastInteractionTime = Date.now(); // User returned → treat as active
        // Reset check for the "new" active screen session
        screenSyncedRef.current = false;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  // D) Navigation / Pathname Changes
  useEffect(() => {
    const now = Date.now();
    // 1. Send usage for PREVIOUS screen
    if (previousPathname.current !== pathname) {
      const elapsed = now - currentScreenStartTime.current;
      sendScreenActivity(previousPathname.current, elapsed);
    }

    // 2. Setup for NEW screen
    previousPathname.current = pathname;
    currentScreenStartTime.current = now;
    // Reset sync guard for the new screen
    screenSyncedRef.current = false;
  }, [pathname]);

  // E) Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (authRef.current.isAuthenticated) {
        sendSessionUpdate();
        const elapsed = Date.now() - currentScreenStartTime.current;
        sendScreenActivity(authRef.current.pathname, elapsed);
      }
    };
  }, []);
};
