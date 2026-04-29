import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
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
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // ⚠️ FIX 1: Prevent multiple registrations
  const hasRegistered = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // ⚠️ FIX 2: Logout Cleanup (Critical Security)
    if (!isAuthenticated) {
      if (hasRegistered.current && expoPushToken) {
        console.log("🧹 Cleaning up push token on logout...");
        // We fire and forget here, or handle errors gracefully
        api
          .patch(
            "/users/notification-preferences",
            { preferences: { pushEnabled: false }, pushToken: null },
            // Note: We'd need the token here, but if we're logging out,
            // usually the context token is already gone.
            // Best practice: The logout function itself should call this before clearing local storage.
          )
          .catch((e) =>
            console.log("Logout cleanup failed (expected if token gone)", e),
          );
      }
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
            api
              .patch(
                "/users/notification-preferences",
                { preferences: { pushEnabled: true }, pushToken },
                { headers: { Authorization: authHeader } },
              )
              .then((res) => {
                console.log("✅ Push token synced successfully!");
                console.log("📦 Server Response Data:", JSON.stringify(res.data, null, 2));
              })
              .catch((err) => {
                console.error("❌ Push sync failed!");
                console.log("Status Code:", err.response?.status);
                console.log("Request Payload:", JSON.stringify({ preferences: { pushEnabled: true }, pushToken }, null, 2));
                console.log(
                  "Server Message:",
                  err.response?.data?.message || err.response?.data,
                );
                hasRegistered.current = false;
              });
          }
        })
        .catch((error) => {
          console.error("❌ Push registration failed:", error);
        });
    }
  }, [isAuthenticated, token]);

  // ⚠️ FIX 5: Separate listener effect (Run only once)
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // ⚠️ FIX 7: Opportunity for in-app banner or state update
        console.log("🔔 Notification Received in Foreground:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // ⚠️ FIX 3: Unsafe Data Access (Crash risk)
        const data = response.notification.request.content.data;
        console.log("👆 Notification Tapped:", data);

        if (data?.navigation?.screen) {
          router.push({
            pathname: `/${data.navigation.screen}` as any,
            params: data.navigation.params,
          });
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
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
