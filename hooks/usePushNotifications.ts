import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform, AppState } from "react-native";
import Constants from "expo-constants";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // "I want the pop-up at the top even if the app is open."
    shouldShowList: true,   // "Keep the notification in the pull-down tray."
    shouldPlaySound: true,  // "Play the 'ting' sound."
    shouldSetBadge: true,   // "Change the little red number on the app icon."
  }),
});


export const usePushNotifications = (
  isAuthenticated: boolean,
  token: string | null,
) => {
  const { expoPushToken, setExpoPushToken } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

  // ⚠️ FIX 1: Prevent multiple registrations
  const hasRegistered = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Reset registration flag on logout
    if (!isAuthenticated) {
      hasRegistered.current = false;
      return;
    }

    if (isAuthenticated && token && !hasRegistered.current) {
      registerForPushNotificationsAsync()
        .then((pushToken) => {
          if (pushToken) {
            setExpoPushToken(pushToken);
            hasRegistered.current = true;

            // ⚠️ FIX 6 & 8: Safe Sync & No Variable Shadowing
            const authHeader = `Bearer ${token}`;
            console.log("📑 Request Header:", authHeader);
            console.log("📡 Syncing push token to backend...");
            console.log("🎟️ NEW PUSH TOKEN:", pushToken);
            console.log("🔗 Endpoint: /users/notification-preferences");

            // ⚠️ FIX: Fetch existing preferences first to avoid overwriting them
            api.get("/users/notification-preferences", { headers: { Authorization: authHeader } })
              .then((res) => {
                const currentPrefs = res.data?.preferences || { pushEnabled: true };
                console.log("📦 Current Preferences from Server:", JSON.stringify(currentPrefs, null, 2));

                const payload = { 
                  preferences: { ...currentPrefs, pushEnabled: true }, 
                  pushToken 
                };
                console.log("📤 Sending Sync Payload:", JSON.stringify(payload, null, 2));

                return api.patch("/users/notification-preferences", payload, { headers: { Authorization: authHeader } });
              })
              .then((res) => {
                console.log("✅ Push token synced successfully!");
                console.log("📦 Final Server Response State:", JSON.stringify(res.data?.preferences || res.data, null, 2));
              })
              .catch((err) => {
                console.error("❌ Push sync failed!");
                console.log("Status Code:", err.response?.status);
                console.log("Error Detail:", err.response?.data?.message || err.response?.data || err.message);
                
                // If it's a 404, maybe the user hasn't initialized preferences yet
                if (err.response?.status === 404) {
                   console.log("ℹ️ Preferences not found (404), attempting first-time initialization...");
                   api.patch("/users/notification-preferences", { preferences: { pushEnabled: true }, pushToken }, { headers: { Authorization: authHeader } })
                     .then(() => console.log("✅ Initialized push preferences!"))
                     .catch(e => console.error("❌ Initial initialization failed:", e.message));
                }
                
                hasRegistered.current = false;
              });
          }
        })
        .catch((error) => {
          console.error("❌ Push registration failed:", error);
        });
    }
  }, [isAuthenticated, token]);

  // 🚀 Function to handle the actual routing
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const navigation = data?.navigation as { screen?: string; params?: any } | undefined;
    console.log("👆 Notification Response Data:", data);

    if (navigation?.screen) {
      // Small delay to ensure the router and layout are fully ready
      setTimeout(() => {
        router.push({
          pathname: `/${navigation.screen}` as any,
          params: navigation.params,
        });
      }, 500);
    }
  };

  // ⚠️ FIX 5: Separate listener effect (Run only once)
  useEffect(() => {
    // 1. Handle notifications that launched the app from a KILLED state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // 2. Handle notifications received/tapped while the app is in the background or foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received in Foreground:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]); // Re-run when auth status changes to ensure we can route properly

  // 🚀 Clear Badge on App Start & when coming to Foreground
  useEffect(() => {
    const clearBadge = async () => {
      if (Platform.OS !== "web") {
        await Notifications.setBadgeCountAsync(0);
      }
    };

    // Clear immediately on mount
    clearBadge();

    // Also clear whenever the app state changes to 'active'
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        clearBadge();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      showBadge: true, // 🚀 This is required for Android badges!
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Try-catch for the project ID fetching
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error("EAS Project ID not found in app.json");
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error("Error getting Push Token:", e);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}
